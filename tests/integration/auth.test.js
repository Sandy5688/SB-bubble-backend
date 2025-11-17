const request = require('supertest');
const app = require('../../app');

describe('Auth Endpoints', () => {
  const apiKey = process.env.INTERNAL_API_KEY;

  describe('POST /api/v1/auth/signup', () => {
    test('should reject signup without API key', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(401);
    });

    test('should reject signup without email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .set('x-api-key', apiKey)
        .send({
          password: 'Password123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Email and password are required');
    });

    test('should reject signup without password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .set('x-api-key', apiKey)
        .send({
          email: 'test@example.com'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/signin', () => {
    test('should reject signin without credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signin')
        .set('x-api-key', apiKey)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    test('should reject without email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .set('x-api-key', apiKey)
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
