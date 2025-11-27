const messagingService = require('../services/messaging.service');
const { createLogger } = require('../config/monitoring');

const logger = createLogger('messaging-controller');

/**
 * Send email
 */
const sendEmail = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    const { recipient, subject, body, htmlBody } = req.body;

    if (!recipient || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: 'recipient, subject, and body are required'
      });
    }

    const result = await messagingService.sendEmail(userId, recipient, subject, body, htmlBody);

    res.json({
      success: true,
      data: {
        messageId: result.id,
        status: result.status,
        sentAt: result.sent_at
      }
    });
  } catch (error) {
    logger.error('Send email failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Send SMS
 */
const sendSMS = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    const { recipient, body } = req.body;

    if (!recipient || !body) {
      return res.status(400).json({
        success: false,
        error: 'recipient and body are required'
      });
    }

    const result = await messagingService.sendSMS(userId, recipient, body);

    res.json({
      success: true,
      data: {
        messageId: result.id,
        status: result.status,
        sentAt: result.sent_at
      }
    });
  } catch (error) {
    logger.error('Send SMS failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  sendEmail,
  sendSMS
};
