'use strict';

const {
  CreateUniversityDto,
  UpdateUniversityDto,
  UniversityQueryDto,
  UniversityListItemDto,
  UniversityDetailDto,
} = require('../../src/modules/university/dto/university.dto');

const baseUniversity = {
  id: 1, name: 'BUET', website: 'https://buet.ac.bd',
  location: 'Dhaka', type: 'PUBLIC', logoUrl: null, description: null,
  scrapeable: true, scrapeUrls: [], createdAt: new Date(), updatedAt: new Date(),
  admission: null, tuitionFees: [], eligibility: null, scholarships: [],
  scrapeJobs: [], _count: { tuitionFees: 3, scholarships: 1 },
};

describe('University DTOs', () => {

  describe('CreateUniversityDto', () => {
    it('parses valid input and sets defaults', () => {
      const dto = new CreateUniversityDto({ name: 'BUET', website: 'https://buet.ac.bd' });
      expect(dto.name).toBe('BUET');
      expect(dto.website).toBe('https://buet.ac.bd');
      expect(dto.type).toBe('PRIVATE');
      expect(dto.scrapeable).toBe(true);
      expect(dto.scrapeUrls).toEqual([]);
    });

    it('throws ZodError for invalid URL', () => {
      expect(() => new CreateUniversityDto({ name: 'X', website: 'not-a-url' })).toThrow();
    });

    it('throws ZodError for name too short', () => {
      expect(() => new CreateUniversityDto({ name: 'X', website: 'https://x.com' })).toThrow();
    });

    it('accepts optional fields', () => {
      const dto = new CreateUniversityDto({
        name: 'BUET', website: 'https://buet.ac.bd',
        type: 'PUBLIC', location: 'Dhaka',
        scrapeUrls: ['https://buet.ac.bd/admission'],
      });
      expect(dto.type).toBe('PUBLIC');
      expect(dto.location).toBe('Dhaka');
      expect(dto.scrapeUrls).toHaveLength(1);
    });
  });

  describe('UpdateUniversityDto', () => {
    it('only includes provided fields', () => {
      const dto = new UpdateUniversityDto({ name: 'Updated Name' });
      expect(dto.name).toBe('Updated Name');
      expect(dto.website).toBeUndefined();
    });

    it('accepts partial update with just scrapeable', () => {
      const dto = new UpdateUniversityDto({ scrapeable: false });
      expect(dto.scrapeable).toBe(false);
    });
  });

  describe('UniversityQueryDto', () => {
    it('coerces string page/limit to numbers', () => {
      const dto = new UniversityQueryDto({ page: 2, limit: 10 });
      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(10);
    });

    it('applies defaults for missing fields', () => {
      const dto = new UniversityQueryDto({});
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.sortBy).toBe('name');
      expect(dto.order).toBe('asc');
    });

    it('clamps limit to max 100', () => {
      const dto = new UniversityQueryDto({ limit: 100 });
      expect(dto.limit).toBe(100);
    });
  });

  describe('UniversityListItemDto', () => {
    it('maps _count to tuitionCount and scholarshipCount', () => {
      const dto = new UniversityListItemDto(baseUniversity);
      expect(dto.tuitionCount).toBe(3);
      expect(dto.scholarshipCount).toBe(1);
    });

    it('does not expose scrapeUrls (list view is minimal)', () => {
      const dto = new UniversityListItemDto(baseUniversity);
      expect(dto.scrapeUrls).toBeUndefined();
    });

    it('maps admission deadline correctly', () => {
      const u = { ...baseUniversity, admission: { applicationDeadline: '30 Nov 2025', scrapedAt: new Date() } };
      const dto = new UniversityListItemDto(u);
      expect(dto.admissionDeadline).toBe('30 Nov 2025');
    });
  });

  describe('UniversityDetailDto', () => {
    it('maps all nested relations', () => { 
      const u = {
        ...baseUniversity,
        admission:    { id: 1, applicationDeadline: '30 Nov 2025', intakeMonths: null, applyUrl: null, requirementsText: null, scrapedAt: null },
        tuitionFees:  [{ id: 1, program: 'BSc', amountLocal: 45000, amountUSD: null, currency: 'BDT', period: 'per semester', scrapedAt: null }],
        eligibility:  { id: 1, minGPA: '4.5', languageReqs: null, otherRequirements: null, scrapedAt: null },
        scholarships: [{ id: 1, name: 'Merit', amount: null, eligibility: null, deadline: null, scrapedAt: null }],
      };
      const dto = new UniversityDetailDto(u);
      expect(dto.admission.applicationDeadline).toBe('30 Nov 2025');
      expect(dto.tuitionFees).toHaveLength(1);
      expect(dto.eligibility.minGPA).toBe('4.5');
      expect(dto.scholarships).toHaveLength(1);
    });

    it('exposes scrapeUrls in detail view', () => {
      const dto = new UniversityDetailDto(baseUniversity);
      expect(dto.scrapeUrls).toBeDefined();
    });
  });
});
