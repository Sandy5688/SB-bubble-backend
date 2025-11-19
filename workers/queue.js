const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const env = require('../config/env');
const logger = require('../utils/logger');

// Redis connection
const connection = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null
});

// Queue configurations
const queueConfig = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 1000
  }
};

// Create queues
const queues = {
  workflow: new Queue('workflow', queueConfig),
  file: new Queue('file', queueConfig),
  email: new Queue('email', queueConfig),
  sms: new Queue('sms', queueConfig),
  ai: new Queue('ai', queueConfig),
  cleanup: new Queue('cleanup', queueConfig)
};

// Queue service
class QueueService {
  // Add job to queue
  async addJob(queueName, jobName, data, options = {}) {
    try {
      const queue = queues[queueName];
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const job = await queue.add(jobName, data, options);
      
      logger.info('Job added to queue', {
        queueName,
        jobName,
        jobId: job.id
      });

      return job;
    } catch (error) {
      logger.error('Add job error', {
        error: error.message,
        queueName,
        jobName
      });
      throw error;
    }
  }

  // Add bulk jobs
  async addBulkJobs(queueName, jobs) {
    try {
      const queue = queues[queueName];
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const bulkJobs = await queue.addBulk(jobs);
      
      logger.info('Bulk jobs added to queue', {
        queueName,
        count: jobs.length
      });

      return bulkJobs;
    } catch (error) {
      logger.error('Add bulk jobs error', {
        error: error.message,
        queueName
      });
      throw error;
    }
  }

  // Get job by ID
  async getJob(queueName, jobId) {
    try {
      const queue = queues[queueName];
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const job = await queue.getJob(jobId);
      return job;
    } catch (error) {
      logger.error('Get job error', {
        error: error.message,
        queueName,
        jobId
      });
      throw error;
    }
  }

  // Remove job
  async removeJob(queueName, jobId) {
    try {
      const queue = queues[queueName];
      const job = await queue.getJob(jobId);
      
      if (job) {
        await job.remove();
        logger.info('Job removed', { queueName, jobId });
      }
    } catch (error) {
      logger.error('Remove job error', {
        error: error.message,
        queueName,
        jobId
      });
      throw error;
    }
  }

  // Get queue stats
  async getQueueStats(queueName) {
    try {
      const queue = queues[queueName];
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount()
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed
      };
    } catch (error) {
      logger.error('Get queue stats error', {
        error: error.message,
        queueName
      });
      throw error;
    }
  }

  // Clean old jobs
  async cleanQueue(queueName, grace = 86400000) {
    try {
      const queue = queues[queueName];
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      await queue.clean(grace, 1000, 'completed');
      await queue.clean(grace, 1000, 'failed');

      logger.info('Queue cleaned', { queueName, grace });
    } catch (error) {
      logger.error('Clean queue error', {
        error: error.message,
        queueName
      });
      throw error;
    }
  }
}

module.exports = {
  queues,
  queueService: new QueueService(),
  connection
};
