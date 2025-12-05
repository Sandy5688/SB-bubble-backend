// workers/queue/queueManager.js - BullMQ Queue Manager
const { Queue } = require('bullmq');
const { createLogger } = require('../../config/monitoring');
const logger = createLogger('queue-manager');

const REDIS_URL = process.env.REDIS_URL;

// Only create queues if Redis is configured
if (!REDIS_URL) {
  logger.warn('⚠️  Redis not configured - Queue system disabled');
  
  // Export stub queues with BullMQ-compatible API
  const stubQueue = {
    process: () => logger.warn('Queue processing skipped - Redis not configured'),
    add: () => Promise.resolve({ id: 'stub', data: {} }),
    on: () => {},
    // BullMQ API compatibility
    getJobs: async () => [], // Return empty array for any job state
    getFailed: async () => [], // Deprecated but keep for compatibility
    getActive: async () => [],
    getWaiting: async () => [],
    getCompleted: async () => [],
    close: async () => {},
  };
  
  module.exports = {
    aiOrchestrator: stubQueue,
    comparisonEngine: stubQueue,
    longAction: stubQueue,
    externalInteraction: stubQueue,
    cleanup: stubQueue,
  };
  
} else {
  // Create real BullMQ queues with Redis connection
  const connection = {
    host: new URL(REDIS_URL).hostname,
    port: new URL(REDIS_URL).port || 6379,
  };
  
  const queues = {
    aiOrchestrator: new Queue('ai-orchestrator', { connection }),
    comparisonEngine: new Queue('comparison-engine', { connection }),
    longAction: new Queue('long-action', { connection }),
    externalInteraction: new Queue('external-interaction', { connection }),
    cleanup: new Queue('cleanup', { connection }),
  };
  
  logger.info('✅ BullMQ queues initialized with Redis');
  
  module.exports = queues;
}
