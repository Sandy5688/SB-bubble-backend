const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { createLogger } = require('../../config/monitoring');

const logger = createLogger('apple-jwks');

// Apple's JWKS endpoint
const APPLE_JWKS_URI = 'https://appleid.apple.com/auth/keys';

// Create JWKS client with caching
const client = jwksClient({
  jwksUri: APPLE_JWKS_URI,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

/**
 * Get Apple's signing key
 */
const getAppleSigningKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      logger.error('Failed to get Apple signing key', { error: err.message });
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

/**
 * Verify Apple ID token with JWKS
 */
const verifyAppleToken = (idToken) => {
  return new Promise((resolve, reject) => {
    // Verify with Apple's public key
    jwt.verify(
      idToken,
      getAppleSigningKey,
      {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: process.env.APPLE_CLIENT_ID
      },
      (err, decoded) => {
        if (err) {
          logger.error('Apple token verification failed', { error: err.message });
          return reject(new Error('Invalid Apple ID token'));
        }

        // Validate required fields
        if (!decoded.sub || !decoded.email) {
          return reject(new Error('Missing required Apple user data'));
        }

        logger.info('Apple token verified', { sub: decoded.sub });
        
        resolve({
          sub: decoded.sub,
          email: decoded.email,
          email_verified: decoded.email_verified || false
        });
      }
    );
  });
};

module.exports = {
  verifyAppleToken
};
