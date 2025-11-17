const request = require('supertest');
const app = require('../../app');

describe('Error Handling', () => {
  describe('404 Errors', () => {
    test('should return 404 for non-existent route', async () => {
      const res = await request(app)
        .get('/api/v1/non-existent-route');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body).toHaveProperty('message');
    });

    test('should return 404 for non-existent nested route', async () => {
      const apiKey = process.env.INTERNAL_API_KEY;
      const res = await request(app)
        .get('/api/v1/user/non-existent')
        .set('x-api-key', apiKey);

      expect(res.status).toBe(404);
    });
  });

  describe('Method Not Allowed', () => {
    test('should handle unsupported HTTP methods', async () => {
      const res = await request(app)
        .patch('/api/v1/health');

      expect(res.status).toBe(404);
    });
  });
});
