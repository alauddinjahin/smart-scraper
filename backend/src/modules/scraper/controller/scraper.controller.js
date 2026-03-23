'use strict';

const scraperService = require('../service/scraper.service');
const prisma         = require('../../../infrastructure/database/prisma.client');
const respond        = require('../../../shared/utils/respond');
const { UnprocessableError } = require('../../../shared/errors/app.error');
const { TriggerResponseDto } = require('../../job/dto/job.dto');
const logger = require('../../../shared/config/logger');
const { ScrapeOneSchema } = require('../../job/schema');
const jobService = require('../../job/service/job.service');


class ScrapeController {

  async triggerOne(req, res) {
    const universityId = parseInt(req.params.id, 10);
    if (isNaN(universityId))
      return res.status(400).json({ success: false, message: 'Invalid university id' });

    const university = await prisma.university.findUnique({
      where:  { id: universityId },
      select: { id: true, name: true, website: true, scrapeable: true },
    });

    if (!university)
      return res.status(404).json({ success: false, message: 'University not found' });

    if (!university.scrapeable)
      throw new UnprocessableError(
        `${university.name} is marked non-scrapeable. Use POST /api/universities/:id to update it.`
      );

    const parsed = ScrapeOneSchema.safeParse(req.body || {});
    const { retryEnabled, maxAttempts } = parsed.success ? parsed.data : {};

    const job = await jobService.createJob({
      universityId,
      status:    'PENDING',
      startedAt: new Date(),
      ...(maxAttempts  !== undefined && { maxAttempts }),
      ...(retryEnabled !== undefined && { retryEnabled }),
    });

    const dto = new TriggerResponseDto({
      jobId:          job.id,
      universityId,
      universityName: university.name,
      pollUrl:        `/api/jobs/${job.id}`,
      message:        `Scrape job queued for "${university.name}". Poll pollUrl for status.`,
    });

    respond.accepted(res, dto);

    scraperService
      .scrapeOne(universityId, job.id, { retryEnabled, maxAttempts })
      .catch(err => logger.error(`[bg] scrapeOne failed university ${universityId}: ${err.message}`));
  }

  async triggerAll(req, res) {
    respond.accepted(res, {
      message: 'Bulk scrape queued for all scrapeable universities.',
    });

    scraperService.scrapeAll()
      .catch(err => logger.error(`[bg] scrapeAll failed: ${err.message}`));
  }
}

module.exports = new ScrapeController();