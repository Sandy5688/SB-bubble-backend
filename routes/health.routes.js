const express = require('express');
const router = express.Router();
const { getRedisClient } = require('../config/redis');
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    // Check database
    const dbResult = await pool.query('SELECT 1');
    health.database = 'healthy';

    // Check Redis (optional)
    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.ping();
        health.redis = 'healthy';
      }
    } catch (redisError) {
      health.redis = 'unavailable';
    }

    res.json(health);
  } catch (error) {
    health.status = 'unhealthy';
    health.database = 'unhealthy';
    health.error = error.message;
    res.status(503).json(health);
  }
});

module.exports = router;
