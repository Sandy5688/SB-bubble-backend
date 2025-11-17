const request = require('supertest');
const app = require('../../app');

describe('Input Validation', () => {
  const apiKey = process.env.INTERNAL_API_KEY;

  describe('Email Validation', () => {
    test('should reject invalid email format in signup', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .set('x-api-key', apiKey)
        .send({
          email: 'invalid-email',
          password: 'Password123!'
        });

      expect([400, 401]).toContain(res.status);
    });
  });

  describe('Required Fields', () => {
    test('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .set('x-api-key', apiKey)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });
  });

  describe('File Upload Validation', () => {
    test('should reject file upload without required fields', async () => {
      const res = await request(app)
        .post('/api/v1/files/upload-url')
        .set('x-api-key', apiKey)
        .set('Authorization', 'Bearer mock-token')
        .send({});

      expect([400, 401]).toContain(res.status);
    });
  });

  describe('Payment Validation', () => {
    test('should reject payment without amount', async () => {
      const res = await request(app)
        .post('/api/v1/pay/stripe/create')
        .set('x-api-key', apiKey)
        .set('Authorization', 'Bearer mock-token')
        .send({
          currency: 'USD'
        });

      expect([400, 401]).toContain(res.status);
    });
  });

  describe('AI Validation', () => {
    test('should reject AI extract without input', async () => {
      const res = await request(app)
        .post('/api/v1/ai/extract')
        .set('x-api-key', apiKey)
        .set('Authorization', 'Bearer mock-token')
        .send({});

      expect([400, 401]).toContain(res.status);
    });
  });
});
