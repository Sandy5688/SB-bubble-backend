const axios = require('axios');
const NodeCache = require('node-cache');
const { createLogger } = require('../../config/monitoring');

const logger = createLogger('apple-jwks');
const jwksCache = new NodeCache({ stdTTL: 86400 }); // 24 hour cache

const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';
let lastValidJWKS = null;

/**
 * Fetch Apple JWKS with error handling, caching, and fallback
 */
async function getAppleJWKS() {
  try {
    // Check cache first
    const cached = jwksCache.get('apple_jwks');
    if (cached) {
      logger.info('Apple JWKS retrieved from cache');
      return cached;
    }

    // Fetch from Apple
    logger.info('Fetching Apple JWKS from endpoint');
    const response = await axios.get(APPLE_JWKS_URL, {
      timeout: 5000,
      headers: { 'User-Agent': 'Bubble-Backend/1.0' }
    });

    if (!response.data || !response.data.keys || !Array.isArray(response.data.keys)) {
      throw new Error('Invalid JWKS response structure');
    }

    const jwks = response.data;
    
    // Cache the valid response
    jwksCache.set('apple_jwks', jwks);
    lastValidJWKS = jwks;
    
    logger.info('Apple JWKS fetched and cached', { keyCount: jwks.keys.length });
    return jwks;

  } catch (error) {
    logger.error('Failed to fetch Apple JWKS', {
      error: error.message,
      hasLastValid: !!lastValidJWKS
    });

    // Fallback to last valid JWKS
    if (lastValidJWKS) {
      logger.warn('Using last valid Apple JWKS as fallback');
      jwksCache.set('apple_jwks', lastValidJWKS); // Re-cache for 24h
      return lastValidJWKS;
    }

    // No fallback available
    throw new Error('Apple JWKS unavailable and no fallback exists');
  }
}

/**
 * Get specific key by kid
 */
async function getApplePublicKey(kid) {
  try {
    const jwks = await getAppleJWKS();
    const key = jwks.keys.find(k => k.kid === kid);
    
    if (!key) {
      logger.warn('Key not found in JWKS, refreshing cache', { kid });
      
      // Force refresh cache
      jwksCache.del('apple_jwks');
      const freshJWKS = await getAppleJWKS();
      const freshKey = freshJWKS.keys.find(k => k.kid === kid);
      
      if (!freshKey) {
        throw new Error(`Apple public key not found for kid: ${kid}`);
      }
      
      return freshKey;
    }
    
    return key;
  } catch (error) {
    logger.error('Failed to get Apple public key', { kid, error: error.message });
    throw error;
  }
}

/**
 * Clear cache (for testing/emergency)
 */
function clearCache() {
  jwksCache.flushAll();
  logger.info('Apple JWKS cache cleared');
}

module.exports = {
  getAppleJWKS,
  getApplePublicKey,
  clearCache
};
