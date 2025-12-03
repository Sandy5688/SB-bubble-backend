// workers/index.js - Worker Manager
const { createLogger } = require('../config/monitoring');

const logger = createLogger('worker-manager');

/**
 * Start all background workers
 * Only starts in production when explicitly enabled
 */
function startAllWorkers() {
  // WORKER START GUARD - Only start when explicitly enabled
  if (process.env.NODE_ENV !== 'production') {
    logger.info('⏸️  Workers disabled in non-production environment');
    return;
  }

  if (process.env.START_WORKERS !== 'true') {
    logger.info('⏸️  Workers disabled (set START_WORKERS=true to enable)');
    return;
  }

  // Check Redis availability (workers need Redis for queues)
  if (!process.env.REDIS_URL) {
    logger.warn('⚠️  REDIS_URL not configured - workers require Redis');
    return;
  }

  logger.info('👷 Starting all workers...');
  
  try {
    require('./private/ai-orchestrator');
    require('./private/comparison-engine');
    require('./private/long-action-runner');
    require('./private/external-interaction');
    require('./private/cleanup');
    
    logger.info('✅ All workers started successfully');
  } catch (error) {
    logger.error('❌ Failed to start workers', { error: error.message });
  }
}

/**
 * Graceful shutdown
 */
function stopAllWorkers() {
  logger.info('🛑 Stopping all workers...');
  // Workers should handle their own cleanup via process signals
}

module.exports = { 
  startAllWorkers,
  stopAllWorkers
};
