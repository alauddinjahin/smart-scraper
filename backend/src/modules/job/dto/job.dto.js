'use strict';
// --- Response DTOs --------------------------------
class ScrapeJobDto {
  constructor(j) {
    this.id            = j.id;
    this.universityId  = j.universityId;
    this.status        = j.status;
    this.strategy      = j.strategy;
    this.attemptCount  = j.attemptCount;
    this.maxAttempts   = j.maxAttempts;
    this.accuracyScore = j.accuracyScore;
    this.fieldsFound   = j.fieldsFound;
    this.fieldsTotal   = j.fieldsTotal;
    this.retryEnabled  = j.retryEnabled;
    this.retryOfJobId  = j.retryOfJobId;
    this.startedAt     = j.startedAt;
    this.completedAt   = j.completedAt;
    this.errorLog      = j.errorLog;
    this.createdAt     = j.createdAt;
    this.university    = j.university
      ? { id: j.university.id, name: j.university.name, website: j.university.website }
      : undefined;
  }
}

class TriggerResponseDto {
  constructor({ jobId, universityId, universityName, pollUrl, message }) {
    this.jobId          = jobId;
    this.universityId   = universityId;
    this.universityName = universityName;
    this.pollUrl        = pollUrl;
    this.message        = message;
  }
}

module.exports = {
  ScrapeJobDto,
  TriggerResponseDto,
};
