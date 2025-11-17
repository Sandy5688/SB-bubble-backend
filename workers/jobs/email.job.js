const messagingService = require('../../services/messaging.service');
const logger = require('../../utils/logger');

class EmailJob {
  async process(job) {
    const { userId, recipient, subject, body, htmlBody } = job.data;
    try {
      logger.info('Processing email job', { jobId: job.id, recipient, attempt: job.attemptsMade + 1 });
      await messagingService.sendEmail(userId, recipient, subject, body, htmlBody);
      logger.info('Email job completed', { jobId: job.id, recipient });
      return { success: true, recipient };
    } catch (error) {
      logger.error('Email job failed', { jobId: job.id, recipient, attempt: job.attemptsMade + 1, error: error.message });
      throw error;
    }
  }
}

module.exports = new EmailJob();
