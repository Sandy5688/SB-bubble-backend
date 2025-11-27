const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const { createLogger } = require('../config/monitoring');

const logger = createLogger('auth-service');

/**
 * Register new user
 */
const registerUser = async (email, password, name) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await query(
      `INSERT INTO users (email, password_hash, name, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, email, name, created_at`,
      [email, hashedPassword, name]
    );
    
    return result.rows[0];
  } catch (error) {
    logger.error('User registration failed', { error: error.message });
    throw error;
  }
};

/**
 * Find user by email
 */
const findUserByEmail = async (email) => {
  try {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Find user failed', { error: error.message });
    throw error;
  }
};

module.exports = {
  registerUser,
  findUserByEmail
};
