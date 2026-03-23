'use strict';

const { CreateUniversitySchema, UpdateUniversitySchema, UniversityQuerySchema } = require("../schema");

class CreateUniversityDto {
  constructor(data) {
    const parsed     = CreateUniversitySchema.parse(data);
    this.name        = parsed.name;
    this.website     = parsed.website;
    this.location    = parsed.location    ?? null;
    this.type        = parsed.type;
    this.logoUrl     = parsed.logoUrl     ?? null;
    this.description = parsed.description ?? null;
    this.scrapeable  = parsed.scrapeable;
    this.scrapeUrls  = parsed.scrapeUrls;
  }
}

class UpdateUniversityDto {
  constructor(data) {
    const parsed = UpdateUniversitySchema.parse(data);
    Object.assign(this, parsed);
  }
}

class UniversityQueryDto {
  constructor(query) {
    const parsed  = UniversityQuerySchema.parse(query);
    this.page     = parsed.page;
    this.limit    = parsed.limit;
    this.search   = parsed.search ?? null;
    this.type     = parsed.type   ?? null;
    this.sortBy   = parsed.sortBy;
    this.order    = parsed.order;
  }
}


class UniversityListItemDto {
  constructor(u) {
    this.id                = u.id;
    this.name              = u.name;
    this.website           = u.website;
    this.location          = u.location;
    this.type              = u.type;
    this.logoUrl           = u.logoUrl;
    this.scrapeable        = u.scrapeable;
    this.tuitionCount      = u._count?.tuitionFees   ?? 0;
    this.scholarshipCount  = u._count?.scholarships  ?? 0;
    this.admissionDeadline = u.admission?.applicationDeadline ?? null;
    this.lastScrapedAt     = u.admission?.scrapedAt            ?? null;
    this.createdAt         = u.createdAt;
    this.updatedAt         = u.updatedAt;
  }
}

class AdmissionResponseDto {
  constructor(a) {
    if (!a) return null;
    this.id                  = a.id;
    this.applicationDeadline = a.applicationDeadline;
    this.requirementsText    = a.requirementsText;
    this.intakeMonths        = a.intakeMonths;
    this.applyUrl            = a.applyUrl;
    this.scrapedAt           = a.scrapedAt;
  }
}

class TuitionFeeResponseDto {
  constructor(f) {
    this.id          = f.id;
    this.program     = f.program;
    this.amountLocal = f.amountLocal;
    this.amountUSD   = f.amountUSD;
    this.currency    = f.currency;
    this.period      = f.period;
    this.scrapedAt   = f.scrapedAt;
  }
}

class EligibilityResponseDto {
  constructor(e) {
    if (!e) return null;
    this.id                = e.id;
    this.minGPA            = e.minGPA;
    this.languageReqs      = e.languageReqs;
    this.otherRequirements = e.otherRequirements;
    this.scrapedAt         = e.scrapedAt;
  }
}

class ScholarshipResponseDto {
  constructor(s) {
    this.id          = s.id;
    this.name        = s.name;
    this.amount      = s.amount;
    this.eligibility = s.eligibility;
    this.deadline    = s.deadline;
    this.scrapedAt   = s.scrapedAt;
  }
}

class UniversityDetailDto {
  constructor(u) {
    this.id           = u.id;
    this.name         = u.name;
    this.website      = u.website;
    this.scrapeUrls   = u.scrapeUrls;
    this.location     = u.location;
    this.type         = u.type;
    this.logoUrl      = u.logoUrl;
    this.description  = u.description;
    this.scrapeable   = u.scrapeable;
    this.createdAt    = u.createdAt;
    this.updatedAt    = u.updatedAt;
    this.admission    = u.admission    ? new AdmissionResponseDto(u.admission)     : null;
    this.tuitionFees  = (u.tuitionFees  || []).map(f => new TuitionFeeResponseDto(f));
    this.eligibility  = u.eligibility  ? new EligibilityResponseDto(u.eligibility) : null;
    this.scholarships = (u.scholarships || []).map(s => new ScholarshipResponseDto(s));
    this.scrapeJobs   = (u.scrapeJobs   || []).map(j => ({
      id:            j.id,
      status:        j.status,
      strategy:      j.strategy,
      accuracyScore: j.accuracyScore,
      fieldsFound:   j.fieldsFound,
      startedAt:     j.startedAt,
      completedAt:   j.completedAt,
    }));
  }
}

class DashboardStatsDto {
  constructor(stats) {
    this.total       = stats.total;
    this.byType      = stats.byType;
    this.avgAccuracy = stats.avgAccuracy;
    this.recentJobs  = stats.recentJobs;
  }
}

module.exports = {
  CreateUniversityDto,
  UpdateUniversityDto,
  UniversityQueryDto,
  UniversityListItemDto,
  UniversityDetailDto,
  DashboardStatsDto,
};
