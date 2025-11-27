// workers/queue/queueManager.js - Bull Queue Manager
const Bull = require('bull');
const { createLogger } = require('../../config/monitoring');
const logger = createLogger('queue-manager');

const REDIS_URL = process.env.REDIS_URL;

// Only create queues if Redis is configured
if (!REDIS_URL) {
  logger.warn('⚠️  Redis not configured - Queue system disabled');
  
  // Export stub queues that log warnings
  const stubQueue = {
    process: () => logger.warn('Queue processing skipped - Redis not configured'),
    add: () => Promise.resolve({ id: 'stub', data: {} }),
    on: () => {},
  };
  
  module.exports = {
    aiOrchestrator: stubQueue,
    comparisonEngine: stubQueue,
    longAction: stubQueue,
    externalInteraction: stubQueue,
    cleanup: stubQueue,
  };
  
} else {
  // Create real queues
  const queues = {
    aiOrchestrator: new Bull('ai-orchestrator', REDIS_URL),
    comparisonEngine: new Bull('comparison-engine', REDIS_URL),
    longAction: new Bull('long-action', REDIS_URL),
    externalInteraction: new Bull('external-interaction', REDIS_URL),
    cleanup: new Bull('cleanup', REDIS_URL),
  };

  // Queue error handling
  Object.entries(queues).forEach(([name, queue]) => {
    queue.on('error', (error) => {
      logger.error(`Queue ${name} error`, { error: error.message });
    });
    
    queue.on('failed', (job, error) => {
      logger.error(`Job failed in ${name}`, { jobId: job.id, error: error.message });
    });
    
    queue.on('completed', (job) => {
      logger.info(`Job completed in ${name}`, { jobId: job.id });
    });
  });

  logger.info('✅ Queue Manager initialized with Redis');
  
  module.exports = queues;
}
