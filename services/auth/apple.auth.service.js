const jwt = require('jsonwebtoken');
const { query } = require('../../config/database');
const { getKey } = require('./apple-jwks.service');
const tokenService = require('./token.service');
const { createLogger } = require('../../config/monitoring');
const logger = createLogger('apple-auth');

/**
 * Verify Apple ID token and create/login user
 */
async function verifyAppleToken(idToken, ipAddress = null, userAgent = null) {
  try {
    // Decode token to get header
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded) {
      throw new Error('Invalid Apple token format');
    }

    // Get Apple's public key
    const key = await getKey(decoded.header);

    // Verify token signature
    const verified = jwt.verify(idToken, key, {
      algorithms: ['RS256'],
      issuer: 'https://appleid.apple.com',
      audience: process.env.APPLE_CLIENT_ID
    });

    const appleUserId = verified.sub;
    const email = verified.email;

    // Check if user exists
    const existingUser = await query(
      'SELECT * FROM users WHERE apple_user_id = $1 OR email = $2',
      [appleUserId, email]
    );

    let user;

    if (existingUser.rows.length > 0) {
      // User exists - login
      user = existingUser.rows[0];
      logger.info('Apple user login', { userId: user.id, email });
    } else {
      // Create new user
      const newUser = await query(
        `INSERT INTO users (email, apple_user_id, email_verified, created_at)
         VALUES ($1, $2, TRUE, NOW())
         RETURNING *`,
        [email, appleUserId]
      );
      user = newUser.rows[0];
      logger.info('Apple user created', { userId: user.id, email });
    }

    // Generate tokens
    const tokens = await tokenService.generateTokenPair(user.id, ipAddress, userAgent);

    // Return user + tokens
    return {
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified
      },
      tokens
    };

  } catch (error) {
    logger.error('Apple token verification failed', { error: error.message });
    throw new Error(`Apple authentication failed: ${error.message}`);
  }
}

/**
 * Refresh Apple token (if needed)
 */
async function refreshAppleToken(userId) {
  try {
    const result = await query(
      'SELECT apple_refresh_token FROM users WHERE id = $1',
      [userId]
    );
    
    if (!result.rows[0]?.apple_refresh_token) {
      throw new Error('No Apple refresh token found');
    }
    
    // Apple doesn't provide refresh tokens in Sign in with Apple
    // User must re-authenticate
    logger.warn('Apple token refresh requested but not supported', { userId });
    return null;
    
  } catch (error) {
    logger.error('Apple token refresh failed', { error: error.message, userId });
    throw error;
  }
}

/**
 * Revoke Apple authorization
 */
async function revokeAppleAuth(userId) {
  try {
    await query(
      `UPDATE users 
       SET apple_user_id = NULL, apple_refresh_token = NULL 
       WHERE id = $1`,
      [userId]
    );
    
    logger.info('Apple authorization revoked', { userId });
    return true;
    
  } catch (error) {
    logger.error('Apple auth revocation failed', { error: error.message, userId });
    throw error;
  }
}

module.exports = {
  verifyAppleToken,
  refreshAppleToken,
  revokeAppleAuth
};
