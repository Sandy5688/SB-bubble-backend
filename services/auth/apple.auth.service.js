const { query } = require('../../config/database');
const { createLogger } = require('../../config/monitoring');
const appleJwks = require('./apple-jwks.service');

const logger = createLogger('apple-auth');

/**
 * Handle Apple callback with JWKS verification
 */
const handleAppleCallback = async (idToken, userInfo) => {
  try {
    // VERIFY TOKEN WITH JWKS (not jwt.decode!)
    const appleData = await appleJwks.verifyAppleToken(idToken);
    
    const appleSub = appleData.sub;
    const email = appleData.email;
    
    // Check if user exists
    let user = await query(
      'SELECT * FROM users WHERE apple_user_identifier = $1',
      [appleSub]
    );
    
    if (user.rows.length === 0) {
      // Create new user
      const result = await query(
        `INSERT INTO users (email, apple_user_identifier, email_verified, created_at)
         VALUES ($1, $2, true, NOW())
         RETURNING *`,
        [email, appleSub]
      );
      user = result;
    }
    
    logger.info('Apple login successful', { userId: user.rows[0].id });
    
    return user.rows[0];
  } catch (error) {
    logger.error('Apple callback failed', { error: error.message });
    throw error;
  }
};

module.exports = {
  handleAppleCallback
};
