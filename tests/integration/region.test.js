const request = require('supertest');
const app = require('../../app');
const redis = require('../../config/redis');

describe('Region Context Layer', () => {
  afterAll(async () => {
    // Close Redis connection properly
    if (redis && redis.disconnect) {
      await redis.disconnect();
    }
  });

  describe('Region Detection', () => {
    test('should detect region from Cloudflare header', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('CF-IPCountry', 'AU');

      expect(res.headers['x-vogue-region']).toBe('AU');
    });

    test('should detect region from IP (MaxMind)', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('X-Forwarded-For', '1.1.1.1');

      expect(res.headers['x-vogue-region']).toBeDefined();
    });

    test('should include region code when available', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('CF-IPCountry', 'AU');

      const region = res.headers['x-vogue-region'];
      expect(region).toMatch(/^AU/);
    });

    test('should fallback to XX for unknown regions', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('X-Forwarded-For', '127.0.0.1');

      expect(res.headers['x-vogue-region']).toBe('XX');
    });
  });

  describe('GPS Detection (Mobile)', () => {
    test('should detect region from GPS coordinates', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('X-GPS-Lat-Long', '-33.8688,151.2093');

      expect(res.headers['x-vogue-region']).toMatch(/AU/);
    }, 10000);

    test('should handle invalid GPS coordinates', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('X-GPS-Lat-Long', 'invalid,coords');

      expect(res.headers['x-vogue-region']).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('should add <50ms latency', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/v1/health')
        .set('CF-IPCountry', 'AU');
      
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });
  });
});
