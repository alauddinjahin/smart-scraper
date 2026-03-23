'use strict';

const universityService = require('../service/university.service');
const respond           = require('../../../shared/utils/respond');

class UniversityController {

  async stats(req, res) {
    const data = await universityService.getDashboardStats();
    respond.ok(res, data);
  }

  async index(req, res) {
    const { data, total, page, limit } = await universityService.list(req.query);
    respond.paginated(res, data, total, page, limit);
  }

  async show(req, res) {
    const data = await universityService.getDetail(req.params.id);
    respond.ok(res, data);
  }

  async store(req, res) {
    const data = await universityService.create(req.body);
    respond.created(res, data);
  }

  async update(req, res) {
    const data = await universityService.update(req.params.id, req.body);
    respond.ok(res, data);
  }

  async destroy(req, res) {
    await universityService.remove(req.params.id);
    respond.noContent(res);
  }
}

module.exports = new UniversityController();
