'use strict';

const prisma = require('../../../infrastructure/database/prisma.client');

class UniversityRepository {

  async findAll({ page, limit, search, type, sortBy, order }) {
    const skip  = (page - 1) * limit;
    const where = {
      ...(search && {
        OR: [
          { name:     { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(type && { type }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.university.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { [sortBy]: order },
        include: {
          admission: {
            select: { applicationDeadline: true, scrapedAt: true },
          },
          _count: {
            select: { tuitionFees: true, scholarships: true },
          },
        },
      }),
      prisma.university.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id) {
    return prisma.university.findUniqueOrThrow({
      where:   { id },
      include: {
        admission:    true,
        tuitionFees:  { orderBy: { amountLocal: 'asc' } },
        eligibility:  true,
        scholarships: true,
        scrapeJobs: {
          orderBy: { createdAt: 'desc' },
          take:    5,
        },
      },
    });
  }

  async create(data) {
    return prisma.university.create({ data });
  }

  async update(id, data) {
    return prisma.university.update({ where: { id }, data });
  }

  async delete(id) {
    return prisma.university.delete({ where: { id } });
  }

  async upsertScrapedData(universityId, scraped) {
    const { admission, tuitionFees, eligibility, scholarships } = scraped;
    const now = new Date();

    if (admission && Object.values(admission).some(Boolean)) {
      await prisma.admissionInfo.upsert({
        where:  { universityId },
        create: { universityId, ...admission, scrapedAt: now },
        update: { ...admission, scrapedAt: now, updatedAt: now },
      });
    }

    if (eligibility && Object.values(eligibility).some(Boolean)) {
      await prisma.eligibilityCriteria.upsert({
        where:  { universityId },
        create: { universityId, ...eligibility, scrapedAt: now },
        update: { ...eligibility, scrapedAt: now, updatedAt: now },
      });
    }

    if (tuitionFees?.length) {
      await prisma.tuitionFee.deleteMany({ where: { universityId } });
      await prisma.tuitionFee.createMany({
        data: tuitionFees.map(f => ({
          ...f,
          universityId,
          scrapedAt: now,
        })),
      });
    }

    if (scholarships?.length) {
      await prisma.scholarship.deleteMany({ where: { universityId } });
      await prisma.scholarship.createMany({
        data: scholarships.map(s => ({
          ...s,
          universityId,
          scrapedAt: now,
        })),
      });
    }

    return prisma.university.findUnique({ where: { id: universityId } });
  }

  async getStats() {
    const [total, byType, jobStats, recentJobs] = await prisma.$transaction([
      prisma.university.count(),
      prisma.university.groupBy({
        by:    ['type'],
        _count: { _all: true },
      }),
      prisma.scrapeJob.aggregate({
        _avg: { accuracyScore: true },
        where: { status: 'COMPLETED' },
      }),
      prisma.scrapeJob.findMany({
        orderBy: { createdAt: 'desc' },
        take:    10,
        include: { university: { select: { name: true } } },
      }),
    ]);

    return {
      total,
      byType,
      avgAccuracy: jobStats._avg.accuracyScore,
      recentJobs,
    };
  }
}

module.exports = new UniversityRepository();