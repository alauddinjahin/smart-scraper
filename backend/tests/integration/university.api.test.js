'use strict';

const request = require('supertest');
const app     = require('../../src/app')(null);
const prisma  = require('../../src/infrastructure/database/prisma.client');

// Helper — create a test university and return it
async function seed(overrides = {}) {
  return prisma.university.create({
    data: {
      name:    overrides.name    || `Test University ${Date.now()}`,
      website: overrides.website || `https://test-${Date.now()}.edu`,
      type:    overrides.type    || 'PUBLIC',
      location: 'Dhaka',
      ...overrides,
    },
  });
}

beforeAll(async () => {
  await prisma.university.deleteMany();
});

afterAll(async () => {
  await prisma.university.deleteMany();
  await prisma.$disconnect();
});

// ── Health check ──────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ── Universities ──────────────────────────────────────────────────────────────
describe('University API', () => {
  let createdId;

  describe('POST /api/universities', () => {
    it('creates a university and returns 201', async () => {
      const res = await request(app)
        .post('/api/universities')
        .send({ name: 'BUET', website: 'https://www.buet.ac.bd', type: 'PUBLIC', location: 'Dhaka' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('BUET');
      createdId = res.body.data.id;
    });

    it('returns 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/universities')
        .send({ website: 'https://noname.edu' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('returns 400 for invalid URL', async () => {
      const res = await request(app)
        .post('/api/universities')
        .send({ name: 'Bad URL', website: 'not-a-url' });
      expect(res.status).toBe(400);
    });

    it('returns 409 on duplicate website', async () => {
      const res = await request(app)
        .post('/api/universities')
        .send({ name: 'Duplicate', website: 'https://www.buet.ac.bd' });
      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/universities', () => {
    it('returns paginated list with meta', async () => {
      const res = await request(app).get('/api/universities');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toMatchObject({ total: expect.any(Number), pages: expect.any(Number) });
    });

    it('filters by search query', async () => {
      const res = await request(app).get('/api/universities?search=BUET');
      expect(res.status).toBe(200);
      expect(res.body.data.some(u => u.name === 'BUET')).toBe(true);
    });

    it('filters by type=PUBLIC', async () => {
      const res = await request(app).get('/api/universities?type=PUBLIC');
      expect(res.status).toBe(200);
      res.body.data.forEach(u => expect(u.type).toBe('PUBLIC'));
    });

    it('respects page and limit', async () => {
      const res = await request(app).get('/api/universities?page=1&limit=1');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(1);
      expect(res.body.meta.limit).toBe(1);
    });

    it('returns 400 for invalid limit', async () => {
      const res = await request(app).get('/api/universities?limit=-5');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/universities/stats', () => {
    it('returns dashboard stats', async () => {
      const res = await request(app).get('/api/universities/stats');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('byType');
    });
  });

  describe('GET /api/universities/:id', () => {
    it('returns full university detail with nested relations', async () => {
      const res = await request(app).get(`/api/universities/${createdId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdId);
      expect(res.body.data).toHaveProperty('tuitionFees');
      expect(res.body.data).toHaveProperty('scholarships');
      expect(res.body.data).toHaveProperty('scrapeJobs');
    });

    it('returns 404 for non-existent id', async () => {
      const res = await request(app).get('/api/universities/9999999');
      expect(res.status).toBe(404);
    });

    it('returns 400 for non-numeric id', async () => {
      const res = await request(app).get('/api/universities/abc');
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/universities/:id', () => {
    it('full update returns 200 with updated data', async () => {
      const res = await request(app)
        .put(`/api/universities/${createdId}`)
        .send({ name: 'BUET Updated', website: 'https://www.buet.ac.bd', location: 'Dhaka Updated' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('BUET Updated');
    });
  });

  describe('PATCH /api/universities/:id', () => {
    it('partial update returns 200', async () => {
      const res = await request(app)
        .patch(`/api/universities/${createdId}`)
        .send({ description: 'Top engineering university' });
      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Top engineering university');
    });

    it('returns 400 when body is empty', async () => {
      const res = await request(app)
        .patch(`/api/universities/${createdId}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/universities/:id', () => {
    it('deletes and returns 204', async () => {
      const u   = await seed({ website: 'https://to-delete.edu' });
      const res = await request(app).delete(`/api/universities/${u.id}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 for non-existent id', async () => {
      const res = await request(app).delete('/api/universities/9999999');
      expect(res.status).toBe(404);
    });
  });
});

// ── Jobs ──────────────────────────────────────────────────────────────────────
describe('Jobs API', () => {
  describe('GET /api/jobs', () => {
    it('returns paginated job list', async () => {
      const res = await request(app).get('/api/jobs');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('filters by status', async () => {
      const res = await request(app).get('/api/jobs?status=COMPLETED');
      expect(res.status).toBe(200);
    });
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
describe('Unknown routes', () => {
  it('returns 404 for unregistered route', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
