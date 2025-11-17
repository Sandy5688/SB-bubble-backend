const fileService = require('../../services/file.service');
const logger = require('../../utils/logger');

class FileJob {
  async process(job) {
    const { fileId, action } = job.data;
    try {
      logger.info('Processing file job', { jobId: job.id, fileId, action });
      
      switch (action) {
        case 'virus_scan':
          await fileService.triggerVirusScan(fileId);
          break;
        default:
          throw new Error(`Unknown file action: ${action}`);
      }
      
      logger.info('File job completed', { jobId: job.id, fileId, action });
      return { success: true, fileId };
    } catch (error) {
      logger.error('File job failed', { jobId: job.id, fileId, error: error.message });
      throw error;
    }
  }
}

module.exports = new FileJob();
