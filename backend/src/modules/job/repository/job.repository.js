'use strict';

const prisma = require('../../../infrastructure/database/prisma.client');

class JobRepository {

  async create(data) {
    return prisma.scrapeJob.create({ data });
  }

  async findById(id) {
    return prisma.scrapeJob.findUniqueOrThrow({
      where:   { id },
      include: {
        university: { select: { id: true, name: true, website: true } },
      },
    });
  }

  async findAll({ page, limit, status, universityId }) {
    const skip  = (page - 1) * limit;
    const where = {
      ...(status       && { status }),
      ...(universityId && { universityId }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.scrapeJob.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          university: { select: { id: true, name: true, website: true } },
        },
      }),
      prisma.scrapeJob.count({ where }),
    ]);

    return { data, total };
  }

  async update(id, data) {
    return prisma.scrapeJob.update({ where: { id }, data });
  }

  async updateToRunning(id) {
    return this.update(id, { status: 'RUNNING', startedAt: new Date() });
  }

  async updateToCompleted(id, { strategy, accuracyScore, fieldsFound }) {
    return this.update(id, {
      status:        'COMPLETED',
      completedAt:   new Date(),
      strategy,
      accuracyScore,
      fieldsFound,
    });
  }

  async updateToFailed(id, errorLog) {
    return this.update(id, {
      status:      'FAILED',
      completedAt: new Date(),
      errorLog:    (errorLog || '').slice(0, 500),
    });
  }

  async incrementAttempt(id) {
    return prisma.scrapeJob.update({
      where: { id },
      data:  { attemptCount: { increment: 1 } },
    });
  }
}

module.exports = new JobRepository();
