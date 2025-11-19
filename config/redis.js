const Redis = require('ioredis');
const env = require('./env');

let redisClient = null;
let isRedisAvailable = false;

/**
 * Initialize Redis client with error handling
 */
function initRedis() {
  if (!env.REDIS_URL) {
    console.warn('⚠️  REDIS_URL not configured - running without Redis');
    return null;
  }

  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        console.error('Redis reconnect on error:', err.message);
        return true;
      }
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
      isRedisAvailable = true;
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis ready');
      isRedisAvailable = true;
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
      isRedisAvailable = false;
    });

    redisClient.on('close', () => {
      console.warn('⚠️  Redis connection closed');
      isRedisAvailable = false;
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    return redisClient;
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error.message);
    return null;
  }
}

/**
 * Get Redis client (with fallback handling)
 */
function getRedisClient() {
  if (!redisClient) {
    redisClient = initRedis();
  }

  if (!redisClient || !isRedisAvailable) {
    throw new Error('Redis not available');
  }

  return redisClient;
}

/**
 * Check if Redis is available
 */
function isRedisHealthy() {
  return isRedisAvailable && redisClient !== null;
}

/**
 * Graceful shutdown
 */
async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    console.log('✅ Redis connection closed gracefully');
  }
}

module.exports = {
  initRedis,
  getRedisClient,
  isRedisHealthy,
  closeRedis
};
