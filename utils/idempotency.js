const { getRedisClient } = require('../config/redis');
const crypto = require('crypto');

/**
 * Idempotency middleware for payment operations
 * Prevents duplicate payment processing
 */
const ensureIdempotency = (ttlSeconds = 86400) => {
  return async (req, res, next) => {
    try {
      const idempotencyKey = req.headers['x-idempotency-key'];

      if (!idempotencyKey) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Missing x-idempotency-key header (required for payment operations)'
        });
      }

      // Validate idempotency key format (UUID or similar)
      if (!/^[a-zA-Z0-9_-]{16,128}$/.test(idempotencyKey)) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid idempotency key format'
        });
      }

      // Check if Redis is available
      let redis;
      try {
        redis = getRedisClient();
      } catch (error) {
        // Redis not available - log warning and continue (fallback mode)
        console.warn('⚠️  Idempotency check skipped - Redis unavailable');
        return next();
      }

      const key = `idempotency:${idempotencyKey}`;
      
      // Check if this request was already processed
      const cached = await redis.get(key);
      
      if (cached) {
        // Request already processed - return cached response
        const cachedResponse = JSON.parse(cached);
        return res.status(cachedResponse.statusCode).json(cachedResponse.body);
      }

      // Store original res.json to intercept response
      const originalJson = res.json.bind(res);
      
      res.json = function(body) {
        // Cache the response
        const response = {
          statusCode: res.statusCode,
          body: body
        };
        
        redis.setex(key, ttlSeconds, JSON.stringify(response)).catch(err => {
          console.error('Failed to cache idempotent response:', err);
        });
        
        // Send original response
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Idempotency middleware error:', error);
      // Don't block request on idempotency errors
      next();
    }
  };
};

module.exports = {
  ensureIdempotency
};
