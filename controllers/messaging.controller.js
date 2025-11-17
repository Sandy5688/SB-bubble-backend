const messagingService = require('../services/messaging.service');
const { AppError } = require('../middleware/errorHandler');

class MessagingController {
  async sendEmail(req, res, next) {
    try {
      const userId = req.user.id;
      const { recipient, subject, body, html_body } = req.body;

      if (!recipient || !subject || !body) {
        throw new AppError('Recipient, subject, and body are required', 400);
      }

      const message = await messagingService.sendEmail(userId, recipient, subject, body, html_body);

      res.status(200).json({
        status: 'success',
        data: { message }
      });
    } catch (error) {
      next(error);
    }
  }

  async sendSMS(req, res, next) {
    try {
      const userId = req.user.id;
      const { recipient, body } = req.body;

      if (!recipient || !body) {
        throw new AppError('Recipient and body are required', 400);
      }

      const message = await messagingService.sendSMS(userId, recipient, body);

      res.status(200).json({
        status: 'success',
        data: { message }
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessageStatus(req, res, next) {
    try {
      const userId = req.user.id;
      const { messageId } = req.params;

      const message = await messagingService.getMessageStatus(messageId, userId);

      res.status(200).json({
        status: 'success',
        data: { message }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MessagingController();
