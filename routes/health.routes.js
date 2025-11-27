const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const env = require('../config/env');
const { validateApiKey } = require('../middleware/security');

/**
 * Basic health check (public)
 * ALWAYS returns 200 - Railway needs this for deployment!
 */
router.get('/', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: '1.0.0'
  };
  
  // Quick database check
  health.database = await quickDbCheck();
  
  // ALWAYS return 200
  res.status(200).json(health);
});

/**
 * Quick database check
 */
async function quickDbCheck() {
  try {
    await pool.query('SELECT 1');
    return 'healthy';
  } catch (error) {
    return 'unhealthy';
  }
}

module.exports = router;
