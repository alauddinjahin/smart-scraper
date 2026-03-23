'use strict';

jest.mock('../../src/modules/university/repository/university.repository');

const repo    = require('../../src/modules/university/repository/university.repository');
const service = require('../../src/modules/university/service/university.service');
const { BadRequestError } = require('../../src/shared/errors/app.error');

const mockUniversity = {
  id: 1, name: 'BUET', website: 'https://buet.ac.bd',
  location: 'Dhaka', type: 'PUBLIC', scrapeable: true,
  scrapeUrls: [], logoUrl: null, description: null,
  createdAt: new Date(), updatedAt: new Date(),
  admission: null, tuitionFees: [], eligibility: null,
  scholarships: [], scrapeJobs: [],
  _count: { tuitionFees: 0, scholarships: 0 },
};

describe('UniversityService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── list ──────────────────────────────────────────────────────────────────
  describe('list()', () => {
    it('returns paginated DTO list', async () => {
      repo.findAll.mockResolvedValue({ data: [mockUniversity], total: 1 });
      const result = await service.list({ page: '1', limit: '20' });
      expect(repo.findAll).toHaveBeenCalledTimes(1);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe(1);
    });

    it('defaults page/limit correctly', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });
      await service.list({});
      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });
  });

  // ── getDetail ─────────────────────────────────────────────────────────────
  describe('getDetail()', () => {
    it('returns UniversityDetailDto for valid id', async () => {
      repo.findById.mockResolvedValue(mockUniversity);
      const result = await service.getDetail('1');
      expect(repo.findById).toHaveBeenCalledWith(1);
      expect(result.name).toBe('BUET');
    });

    it('throws BadRequestError for non-numeric id', async () => {
      await expect(service.getDetail('abc')).rejects.toThrow(BadRequestError);
      await expect(service.getDetail('abc')).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ── create ────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('creates and returns detail DTO', async () => {
      repo.create.mockResolvedValue(mockUniversity);
      repo.findById.mockResolvedValue(mockUniversity);
      const result = await service.create({ name: 'BUET', website: 'https://buet.ac.bd' });
      expect(repo.create).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(1);
    });

    it('throws ZodError for missing name', async () => {
      await expect(service.create({ website: 'https://buet.ac.bd' }))
        .rejects.toThrow();
    });

    it('throws ZodError for invalid website URL', async () => {
      await expect(service.create({ name: 'X', website: 'not-a-url' }))
        .rejects.toThrow();
    });
  });

  // ── update ────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('updates and returns updated DTO', async () => {
      repo.update.mockResolvedValue({ ...mockUniversity, name: 'Updated' });
      repo.findById.mockResolvedValue({ ...mockUniversity, name: 'Updated' });
      const result = await service.update('1', { name: 'Updated' });
      expect(repo.update).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Updated' }));
      expect(result.name).toBe('Updated');
    });

    it('throws BadRequestError when dto is empty', async () => {
      await expect(service.update('1', {})).rejects.toThrow(BadRequestError);
    });

    it('throws BadRequestError for invalid id', async () => {
      await expect(service.update('xyz', { name: 'X' }))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('calls repo.delete with parsed integer id', async () => {
      repo.delete.mockResolvedValue(mockUniversity);
      await service.remove('1');
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it('throws BadRequestError for non-numeric id', async () => {
      await expect(service.remove('nan')).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ── getDashboardStats ─────────────────────────────────────────────────────
  describe('getDashboardStats()', () => {
    it('returns DashboardStatsDto', async () => {
      repo.getStats.mockResolvedValue({
        total: 6, byType: [], avgAccuracy: 82.5, recentJobs: [],
      });
      const result = await service.getDashboardStats();
      expect(result.total).toBe(6);
      expect(result.avgAccuracy).toBe(82.5);
    });
  });
});
