const request = require('supertest');
const app = require('../../app');

describe('Security Middleware', () => {
  describe('API Key Validation', () => {
    test('should reject request without API key', async () => {
      const res = await request(app)
        .get('/api/v1/user/profile');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('API key is required');
    });

    test('should reject request with invalid API key', async () => {
      const res = await request(app)
        .get('/api/v1/user/profile')
        .set('x-api-key', 'invalid-key');

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Invalid API key');
    });
  });

  describe('CORS Headers', () => {
    test('should include CORS headers', async () => {
      const res = await request(app)
        .get('/api/v1/health');

      expect(res.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Security Headers', () => {
    test('should include security headers from Helmet', async () => {
      const res = await request(app)
        .get('/api/v1/health');

      expect(res.headers).toHaveProperty('x-content-type-options');
      expect(res.headers).toHaveProperty('x-frame-options');
    });
  });
});
