'use strict';
const { z } = require('zod');

const CreateUniversitySchema = z.object({
  name:        z.string().min(2).max(200),
  website:     z.string().url(),
  location:    z.string().max(200).optional(),
  type:        z.enum(['PUBLIC', 'PRIVATE']).default('PRIVATE'),
  logoUrl:     z.string().url().optional().nullable(),
  description: z.string().max(2000).optional(),
  scrapeable:  z.boolean().default(true),
  scrapeUrls:  z.array(z.string().url()).max(10).default([]),
});

const UpdateUniversitySchema = CreateUniversitySchema.partial();

const UniversityQuerySchema = z.object({
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  type:   z.enum(['PUBLIC', 'PRIVATE']).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('name'),
  order:  z.enum(['asc', 'desc']).default('asc'),
});

module.exports = {
  CreateUniversitySchema,
  UpdateUniversitySchema,
  UniversityQuerySchema,
}