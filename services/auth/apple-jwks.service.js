const fetch = require('node-fetch');
const { createLogger } = require('../../utils/logger');
const logger = createLogger('apple-jwks');

class AppleJWKSService {
  constructor() {
    this.cachedKeys = null;
    this.cacheExpiry = 0;
    this.CACHE_TTL = 3600000; // 1 hour
    this.JWKS_URL = 'https://appleid.apple.com/auth/keys';
  }

  async getPublicKey(kid) {
    try {
      // Check cache first
      if (this.cachedKeys && Date.now() < this.cacheExpiry) {
        const key = this.cachedKeys.find(k => k.kid === kid);
        if (key) {
          logger.info('Using cached Apple JWKS key', { kid });
          return key;
        }
      }

      // Fetch fresh keys with timeout
      logger.info('Fetching fresh Apple JWKS keys');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(this.JWKS_URL, {
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Apple JWKS fetch failed: ${response.status}`);
      }

      const data = await response.json();
      this.cachedKeys = data.keys;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;

      logger.info('Apple JWKS keys refreshed', { keyCount: data.keys.length });

      const key = this.cachedKeys.find(k => k.kid === kid);
      if (!key) {
        throw new Error(`Key ${kid} not found in Apple JWKS`);
      }

      return key;
    } catch (error) {
      logger.error('Apple JWKS fetch failed', { error: error.message, kid });

      // If cache exists, use stale cache as fallback
      if (this.cachedKeys) {
        logger.warn('Using stale JWKS cache as fallback');
        const key = this.cachedKeys.find(k => k.kid === kid);
        if (key) return key;
      }

      throw new Error('Apple authentication unavailable');
    }
  }

  clearCache() {
    this.cachedKeys = null;
    this.cacheExpiry = 0;
    logger.info('Apple JWKS cache cleared');
  }
}

module.exports = new AppleJWKSService();
