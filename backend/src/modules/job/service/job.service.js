'use strict';

const prisma = require('../../../infrastructure/database/prisma.client');
const logger = require('../../../shared/config/logger');
const jobRepo        = require('../../job/repository/job.repository');
const { ScrapeJobDto } = require('../dto/job.dto');

class JobService {

  async createJob(data) {
    try {
      return await jobRepo.create(data);
    } catch (err) {
      logger.error('Failed to create job', err);
      throw err;
    }
  }

   async updateJob(id, data) {
    try {
      return await jobRepo.update(id, data)
    } catch (err) {
      logger.error('Failed to update job', err);
      throw err;
    }
  }

  async getJobById(id) {
    try {
      return await jobRepo.findById(id);
    } catch (err) {
      logger.error(`Failed to fetch job ${id}`, err);
      throw err;
    }
  }

  async getJobs({ page = 1, limit = 20, status, universityId }) {
    try {
      return await jobRepo.findAll({ page, limit, status, universityId });
    } catch (err) {
      logger.error('Failed to fetch jobs', err);
      throw err;
    }
  }

  async startJob(id) {
    try {
      return await jobRepo.updateToRunning(id);
    } catch (err) {
      logger.error(`Failed to start job ${id}`, err);
      throw err;
    }
  }

  async completeJob(id, { strategy, accuracyScore, fieldsFound }) {
    try {
      return await jobRepo.updateToCompleted(id, { strategy, accuracyScore, fieldsFound });
    } catch (err) {
      logger.error(`Failed to complete job ${id}`, err);
      throw err;
    }
  }

  async failJob(id, errorLog) {
    try {
      return await jobRepo.updateToFailed(id, errorLog);
    } catch (err) {
      logger.error(`Failed to fail job ${id}`, err);
      throw err;
    }
  }

  async incrementAttempt(id) {
    try {
      return await jobRepo.incrementAttempt(id);
    } catch (err) {
      logger.error(`Failed to increment attempt for job ${id}`, err);
      throw err;
    }
  }

  async retryJob(id, maxAttempts = 3, delayMs = 3000) {
    const job = await this.getJobById(id);
    if (!job) throw new Error('Job not found');

    if (job.attemptCount >= maxAttempts) {
      return this.failJob(id, 'Max attempts reached');
    }

    await this.incrementAttempt(id);
    logger.info(`Retrying job ${id} after ${delayMs}ms, attempt ${job.attemptCount + 1}`);
    return new Promise(resolve => setTimeout(() => resolve(this.startJob(id)), delayMs));
  }


  async getJobStatus(jobId) {
        const job = await jobRepo.findById(jobId);
        if(!job) throw new Error("Unable to get Job");

        if (job.status === 'RETRYING') {
            try {
                let current = job;
                for (let i = 0; i < 10; i++) {          // max chain depth = maxAttempts (3)
                    const next = await prisma.scrapeJob.findFirst({
                        where: { retryOfJobId: current.id },
                        orderBy: { id: 'desc' },
                        include: { university: { select: { id: true, name: true, website: true } } },
                    });
                    if (!next) break;
                    current = next;
                }
                // Return the tip of the chain if it's different from the original
                if (current.id !== job.id) return new ScrapeJobDto(current);
            } catch { }
        }

        return new ScrapeJobDto(job);
    }

    async listJobs(query) {
        const { data, total } = await jobRepo.findAll(query);
        return {
            data: data.map(j => new ScrapeJobDto(j)),
            total,
            page: query.page,
            limit: query.limit,
        };
    }

}


module.exports = new JobService();