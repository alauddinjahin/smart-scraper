'use strict';

const universityRepo = require('../repository/university.repository');
const {
  CreateUniversityDto,
  UpdateUniversityDto,
  UniversityQueryDto,
  UniversityListItemDto,
  UniversityDetailDto,
  DashboardStatsDto,
} = require('../dto/university.dto');
const { BadRequestError } = require('../../../shared/errors/app.error');

class UniversityService {

  async list(rawQuery) {
    const query  = new UniversityQueryDto(rawQuery);
    const result = await universityRepo.findAll(query);
    return {
      data:  result.data.map(u => new UniversityListItemDto(u)),
      total: result.total,
      page:  query.page,
      limit: query.limit,
    };
  }

  async getDetail(id) {
    const parsed = this._parseId(id);
    const uni    = await universityRepo.findById(parsed);
    return new UniversityDetailDto(uni);
  }

  async create(body) {
    const dto = new CreateUniversityDto(body);
    const uni = await universityRepo.create(dto);
    return new UniversityDetailDto(await universityRepo.findById(uni.id));
  }

  async update(id, body) {
    const parsed = this._parseId(id);
    const dto    = new UpdateUniversityDto(body);
    if (Object.keys(dto).length === 0)
      throw new BadRequestError('No fields provided for update');
    await universityRepo.update(parsed, dto);
    return new UniversityDetailDto(await universityRepo.findById(parsed));
  }

  async remove(id) {
    const parsed = this._parseId(id);
    await universityRepo.delete(parsed);
  }

  async getDashboardStats() {
    const stats = await universityRepo.getStats();
    return new DashboardStatsDto(stats);
  }

  _parseId(id) {
    const n = parseInt(id, 10);
    if (isNaN(n)) throw new BadRequestError('Invalid university id');
    return n;
  }
}

module.exports = new UniversityService();
