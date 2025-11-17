const aiService = require('../../services/ai.service');
const logger = require('../../utils/logger');

class AIJob {
  async process(job) {
    const { userId, action, data } = job.data;
    try {
      logger.info('Processing AI job', { jobId: job.id, userId, action });
      
      let result;
      switch (action) {
        case 'extract':
          result = await aiService.extractData(userId, data.input, data.extractionType);
          break;
        case 'structure':
          result = await aiService.structureData(userId, data.input, data.schema);
          break;
        case 'compare':
          result = await aiService.compareData(userId, data.dataA, data.dataB, data.comparisonType);
          break;
        case 'decide':
          result = await aiService.makeDecision(userId, data.context, data.options, data.criteria);
          break;
        default:
          throw new Error(`Unknown AI action: ${action}`);
      }
      
      logger.info('AI job completed', { jobId: job.id, userId, action });
      return { success: true, result };
    } catch (error) {
      logger.error('AI job failed', { jobId: job.id, userId, action, error: error.message });
      throw error;
    }
  }
}

module.exports = new AIJob();
