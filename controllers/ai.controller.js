const { createLogger } = require('../config/monitoring');
const logger = createLogger('ai-controller');

const aiService = require('../services/ai.service');
const { AppError } = require('../middleware/errorHandler');

class AIController {
  async extractData(req, res, next) {
    try {
      const userId = req.user.id;
      const { input, extraction_type } = req.body;

      if (!input) {
        throw new AppError('Input is required', 400);
      }

      const result = await aiService.extractData(userId, input, extraction_type);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
    logger.error('AI operation failed', { error: error.message });
      next(error);
    }
  }

  async structureData(req, res, next) {
    try {
      const userId = req.user.id;
      const { input, schema } = req.body;

      if (!input) {
        throw new AppError('Input is required', 400);
      }

      const result = await aiService.structureData(userId, input, schema);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
    logger.error('AI operation failed', { error: error.message });
      next(error);
    }
  }

  async compareData(req, res, next) {
    try {
      const userId = req.user.id;
      const { data_a, data_b, comparison_type } = req.body;

      if (!data_a || !data_b) {
        throw new AppError('Both data_a and data_b are required', 400);
      }

      const result = await aiService.compareData(userId, data_a, data_b, comparison_type);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
    logger.error('AI operation failed', { error: error.message });
      next(error);
    }
  }

  async makeDecision(req, res, next) {
    try {
      const userId = req.user.id;
      const { context, options, criteria } = req.body;

      if (!context || !options) {
        throw new AppError('Context and options are required', 400);
      }

      const result = await aiService.makeDecision(userId, context, options, criteria);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
    logger.error('AI operation failed', { error: error.message });
      next(error);
    }
  }
}

module.exports = new AIController();
