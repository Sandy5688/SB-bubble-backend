const { pool } = require('../config/database');
const { createLogger } = require('../config/monitoring');

const logger = createLogger('rls-helper');

/**
 * Set RLS user context for the current database session
 * MUST be called after every authentication success
 */
async function setUserContext(client, userId, source = 'auth') {
  try {
    await client.query('SELECT set_user_context($1)', [userId]);
    logger.debug('RLS context set', { userId, source });
    return true;
  } catch (error) {
    logger.error('Failed to set RLS context', { userId, source, error: error.message });
    throw new Error('Database session setup failed');
  }
}

/**
 * Get a database client with RLS context already set
 */
async function getClientWithContext(userId, source = 'auth') {
  const client = await pool.connect();
  try {
    await setUserContext(client, userId, source);
    return client;
  } catch (error) {
    client.release();
    throw error;
  }
}

/**
 * Execute query with RLS context
 */
async function queryWithContext(userId, queryText, params = []) {
  const client = await getClientWithContext(userId);
  try {
    const result = await client.query(queryText, params);
    return result;
  } finally {
    client.release();
  }
}

module.exports = {
  setUserContext,
  getClientWithContext,
  queryWithContext
};
