const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/db-test', async (req, res) => {
  const tests = {
    env_check: {
      database_url_exists: !!process.env.DATABASE_URL,
      database_url_preview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET',
      node_env: process.env.NODE_ENV
    },
    connection_test: null
  };

  try {
    const result = await pool.query('SELECT NOW() as time, version() as pg_version');
    tests.connection_test = {
      status: 'SUCCESS',
      time: result.rows[0].time,
      postgres: result.rows[0].pg_version.substring(0, 50)
    };
  } catch (error) {
    tests.connection_test = {
      status: 'FAILED',
      error: error.message,
      code: error.code,
      host: error.hostname || 'unknown'
    };
  }

  res.json(tests);
});

module.exports = router;
