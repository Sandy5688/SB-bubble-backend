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

/**
 * Standard query function (uses pool directly)
 */
const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    logger.error('Query failed', { error: error.message, query: text });
    throw error;
  }
};

/**
 * Get a dedicated client for session-scoped operations
 * Use this when you need RLS context throughout a transaction
 */
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Execute queries with user context (RLS enforcement)
 * Uses a single connection to maintain session state
 */
const withUserContext = async (userId, role, callback) => {
  const client = await pool.connect();
  try {
    // Set user context for RLS policies
    await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId.toString()]);
    await client.query('SELECT set_config($1, $2, true)', ['app.current_user_role', role || 'user']);
    
    // Execute the callback with the context-aware client
    const result = await callback({
      query: (text, params) => client.query(text, params)
    });
    
    return result;
  } catch (error) {
    logger.error('Query with context failed', { error: error.message, userId });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Execute a transaction with user context
 */
const withTransaction = async (userId, role, callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Set user context for RLS
    if (userId) {
      await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId.toString()]);
      await client.query('SELECT set_config($1, $2, true)', ['app.current_user_role', role || 'user']);
    }
    
    const result = await callback({
      query: (text, params) => client.query(text, params)
    });
    
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction failed', { error: error.message, userId });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Health check function
 */
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
  getClient,
  withUserContext,
  withTransaction,
  healthCheck
};
