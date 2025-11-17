const request = require('supertest');
const app = require('../../app');

describe('Health Endpoint', () => {
  describe('GET /api/v1/health', () => {
    test('should return health status', async () => {
      const res = await request(app)
        .get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });

    test('should not require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/health');

      expect(res.status).toBe(200);
    });
  });
});
