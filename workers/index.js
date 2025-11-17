const { Worker } = require('bullmq');
const { connection } = require('./queue');
const env = require('../config/env');
const logger = require('../utils/logger');

// Import job processors
const workflowJob = require('./jobs/workflow.job');
const fileJob = require('./jobs/file.job');
const emailJob = require('./jobs/email.job');
const aiJob = require('./jobs/ai.job');

// Worker configuration
const workerConfig = {
  connection,
  concurrency: env.WORKER_CONCURRENCY || 5
};

// Create workers
const workers = [];

if (env.ENABLE_WORKERS) {
  // Workflow worker
  const workflowWorker = new Worker('workflow', async (job) => {
    return await workflowJob.process(job);
  }, workerConfig);

  // File worker
  const fileWorker = new Worker('file', async (job) => {
    return await fileJob.process(job);
  }, workerConfig);

  // Email worker
  const emailWorker = new Worker('email', async (job) => {
    return await emailJob.process(job);
  }, workerConfig);

  // AI worker
  const aiWorker = new Worker('ai', async (job) => {
    return await aiJob.process(job);
  }, workerConfig);

  workers.push(workflowWorker, fileWorker, emailWorker, aiWorker);

  // Worker event handlers
  workers.forEach((worker) => {
    worker.on('completed', (job) => {
      logger.info('Job completed', {
        queue: worker.name,
        jobId: job.id
      });
    });

    worker.on('failed', (job, err) => {
      logger.error('Job failed', {
        queue: worker.name,
        jobId: job?.id,
        error: err.message
      });
    });

    worker.on('error', (err) => {
      logger.error('Worker error', {
        queue: worker.name,
        error: err.message
      });
    });
  });

  logger.info(`${workers.length} workers started successfully`);
} else {
  logger.warn('Workers are disabled. Set ENABLE_WORKERS=true to enable.');
}

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down workers...');
  await Promise.all(workers.map(worker => worker.close()));
  await connection.quit();
  logger.info('Workers shut down successfully');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { workers };
