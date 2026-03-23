const { z } = require('zod');

const ScrapeOneSchema = z.object({
  retryEnabled: z.boolean().optional(),
  maxAttempts:  z.coerce.number().int().min(1).max(5).optional(),
});

const JobQuerySchema = z.object({
  page:         z.coerce.number().int().positive().default(1),
  limit:        z.coerce.number().int().min(1).max(100).default(20),
  status:       z.enum(['PENDING','RUNNING','COMPLETED','FAILED','RETRYING','SKIPPED']).optional(),
  universityId: z.coerce.number().int().positive().optional(),
});

module.exports = {
    ScrapeOneSchema,
    JobQuerySchema
}