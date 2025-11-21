// workers/index.js - Worker Manager
const { createLogger } = require('../config/monitoring');

const logger = createLogger('worker-manager');

function startAllWorkers() {
  logger.info('👷 Starting all workers...');
  
  require('./private/ai-orchestrator');
  require('./private/comparison-engine');
  require('./private/long-action-runner');
  require('./private/external-interaction');
  require('./private/cleanup');
  
  logger.info('✅ All workers started successfully');
}

module.exports = { startAllWorkers };
