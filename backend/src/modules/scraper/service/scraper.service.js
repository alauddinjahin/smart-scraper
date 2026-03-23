'use strict';

const prisma         = require('../../../infrastructure/database/prisma.client');
const engine         = require('../engine/scraper.engine');
const logger         = require('../../../shared/config/logger');
const jobRepo        = require('../../job/repository/job.repository');
const universityRepo = require('../../university/repository/university.repository');
const sanitiserService = require('./sanitiser.service');
const JobService = require('../../job/service/job.service');

const DEFAULT_ACCURACY_THRESHOLD = 50; // minimum % to consider scrape successful
const DEFAULT_MAX_ATTEMPTS       = 3;
const INTER_RETRY_DELAY_MS       = 3000;
const INTER_UNIVERSITY_DELAY_MS  = 2000;

class ScraperService {

    constructor(){
        this.jobService = new JobService();
    }

  async scrapeOne(universityId, existingJobId = null, options = {}) {
    const university = await prisma.university.findUniqueOrThrow({
      where:  { id: universityId },
      select: { id: true, name: true, website: true, scrapeUrls: true, scrapeable: true },
    });

    if (!university.scrapeable) {
      logger.warn(`[scraper] ${university.name} is non-scrapeable — skipping`);
      return { success: false, jobId: existingJobId, universityId,
               error: 'University is marked non-scrapeable. Enter data manually.' };
    }

    const siteConfig = await this._loadSiteConfig(universityId);
    const retryEnabled      = options.retryEnabled
      ?? siteConfig?.retryPolicy?.enabled
      ?? true;

    const maxAttempts       = options.maxAttempts
      ?? siteConfig?.retryPolicy?.maxAttempts
      ?? DEFAULT_MAX_ATTEMPTS;

    const accuracyThreshold = siteConfig?.accuracyThreshold ?? DEFAULT_ACCURACY_THRESHOLD;

    // Upsert job to RUNNING
    let job;
    if (existingJobId) {
      job = await this.jobService.startJob(existingJobId);
    } else {
      job = await this.jobService.createJob({
        universityId,
        status:       'RUNNING',
        startedAt:    new Date(),
        maxAttempts,
        retryEnabled,
      });
    }

    logger.info(`[job:${job.id}] Starting scrape — "${university.name}" (attempt 1/${maxAttempts})`);

    return this._executeWithRetry({
      job,
      university,
      maxAttempts,
      retryEnabled,
      accuracyThreshold,
      attempt: 1,
    });
  }

  async _executeWithRetry({ job, university, maxAttempts, retryEnabled, accuracyThreshold, attempt }) {
    try {
      const urls = university.scrapeUrls?.length
        ? university.scrapeUrls
        : [university.website];

      const scrapedData = urls.length > 1
        ? await engine.scrapeMultiple(urls, university.id)
        : await engine.scrape(urls[0], university.id);

      const { score, fieldsFound } = engine.computeAccuracy(scrapedData);

      logger.info(`[job:${job.id}] Accuracy: ${score.toFixed(0)}% (${fieldsFound}/4 fields) | threshold: ${accuracyThreshold}%`);

      if (score === 0 && attempt === 1) {
        const strategy = scrapedData._strategy || 'unknown';
        if (strategy === 'axios') {
          logger.warn(`[job:${job.id}] Zero fields from axios — escalating to puppeteer`);
          try {
            const existing = await prisma.universityScrapeConfig.findUnique({
              where: { universityId: university.id },
            });
            const merged = {
              ...(existing?.config || {}),
              strategy:    'puppeteer',
              detectedAt:  new Date().toISOString(),
            };
            await prisma.universityScrapeConfig.upsert({
              where:  { universityId: university.id },
              update: { config: merged },
              create: { universityId: university.id, config: merged },
            });
          } catch { }
        }
      }

      // Accuracy below threshold — retry if allowed
      if (score < accuracyThreshold && retryEnabled && attempt < maxAttempts) {
        logger.warn(`[job:${job.id}] Below threshold — retrying (${attempt + 1}/${maxAttempts})`);
        await this.jobService.updateJob(job.id, { status: 'RETRYING', attemptCount: attempt });
        await new Promise(r => setTimeout(r, INTER_RETRY_DELAY_MS));

        // Create a new job record that links back to the original
        const retryJob = await this.jobService.createJob({
          universityId:  university.id,
          status:        'RUNNING',
          startedAt:     new Date(),
          retryOfJobId:  job.id,
          maxAttempts,
          retryEnabled,
        });

        return this._executeWithRetry({
          job: retryJob,
          university,
          maxAttempts,
          retryEnabled,
          accuracyThreshold,
          attempt: attempt + 1,
        });
      }

      // Persist scraped data
      const sanitised = _sanitiseScrapedData(scrapedData);
      await universityRepo.upsertScrapedData(university.id, sanitised);

      const usedStrategy = scrapedData._strategy
        || (await this._loadSiteConfig(university.id))?.strategy
        || 'unknown';

      await this.jobService.completeJob(job.id, {
        strategy:      usedStrategy,
        accuracyScore: score,
        fieldsFound,
      });

      logger.info(`[job:${job.id}] Completed — accuracy ${score.toFixed(0)}%`);
      return { success: true, jobId: job.id, universityId: university.id, accuracyScore: score, data: scrapedData };

    } catch (err) {
      // Failure - retry if allowed
      if (retryEnabled && attempt < maxAttempts) {
        logger.warn(`[job:${job.id}] Error on attempt ${attempt} — retrying: ${err.message}`);
        // await jobRepo.update(job.id, { status: 'RETRYING', errorLog: err.message.slice(0, 500) });
        await this.jobService.updateJob(job.id, { status: 'RETRYING', errorLog: err.message.slice(0, 500) });

        await new Promise(r => setTimeout(r, INTER_RETRY_DELAY_MS));

        const retryJob = await this.jobService.createJob({
          universityId:  university.id,
          status:        'RUNNING',
          startedAt:     new Date(),
          retryOfJobId:  job.id,
          maxAttempts,
          retryEnabled,
        });

        return this._executeWithRetry({
          job: retryJob,
          university,
          maxAttempts,
          retryEnabled,
          accuracyThreshold,
          attempt: attempt + 1,
        });
      }

      await this.jobService.failJob(job.id, err.message);

      logger.error(`[job:${job.id}] Failed after ${attempt} attempt(s): ${err.message}`);
      return { success: false, jobId: job.id, universityId: university.id, error: err.message };
    }
  }

  async scrapeAll() {
    const universities = await prisma.university.findMany({
      where:   { scrapeable: true },
      select:  { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    logger.info(`[scraper:all] Starting bulk scrape — ${universities.length} universities`);
    const results = [];

    for (const u of universities) {
      const result = await this.scrapeOne(u.id)
        .catch(err => ({ success: false, universityId: u.id, name: u.name, error: err.message }));
      results.push({ name: u.name, ...result });

      await new Promise(r => setTimeout(r, INTER_UNIVERSITY_DELAY_MS));
    }

    const succeeded = results.filter(r => r.success).length;
    logger.info(`[scraper:all] Done — ${succeeded}/${universities.length} succeeded`);
    return results;
  }

  async _loadSiteConfig(universityId) {
    try {
      const record = await prisma.universityScrapeConfig.findUnique({ where: { universityId } });
      return record?.config || null;
    } catch { return null; }
  }

  _sanitiseScrapedData(data){
    return sanitiserService.sanitiseScrapedData(data);
  }
}

module.exports = new ScraperService();