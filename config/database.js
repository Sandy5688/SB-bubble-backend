const { Pool } = require('pg');
const { createLogger } = require('./monitoring');
const logger = createLogger('database');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  logger.info('Database connected');
});

pool.on('error', (err) => {
  logger.error('Database error', { error: err.message });
});

// Query function with error handling
const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    logger.error('Query failed', { error: error.message, query: text });
    throw error;
  }
};

// Health check function
const healthCheck = async () => {
  try {
    await pool.query('SELECT 1');
    return { healthy: true };
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    return { healthy: false, error: error.message };
  }
};

module.exports = {
  pool,
  query,
  healthCheck
};
