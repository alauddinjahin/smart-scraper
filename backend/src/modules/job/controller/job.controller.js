'use strict';

const respond        = require('../../../shared/utils/respond');
const { BadRequestError } = require('../../../shared/errors/app.error');
const { JobQuerySchema } = require('../schema');
const jobService = require('../service/job.service');

class JobController {

  async show(req, res) {
    const jobId = parseInt(req.params.jobId, 10);
    if (isNaN(jobId)) throw new BadRequestError('Invalid jobId');
    const data = await jobService.getJobStatus(jobId);
    respond.ok(res, data);
  }

  async index(req, res) {
    const query = JobQuerySchema.parse(req.query);
    const { data, total, page, limit } = await jobService.listJobs(query);
    respond.paginated(res, data, total, page, limit);
  }
}

module.exports = new JobController();
