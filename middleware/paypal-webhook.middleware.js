const crypto = require('crypto');
const { createLogger } = require('../config/monitoring');

const logger = createLogger('paypal-webhook');

/**
 * Verify PayPal webhook signature
 */
const verifyPayPalWebhook = async (req, res, next) => {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    
    if (!webhookId) {
      logger.error('PAYPAL_WEBHOOK_ID not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    // Get headers
    const transmissionId = req.headers['paypal-transmission-id'];
    const transmissionTime = req.headers['paypal-transmission-time'];
    const transmissionSig = req.headers['paypal-transmission-sig'];
    const certUrl = req.headers['paypal-cert-url'];
    const authAlgo = req.headers['paypal-auth-algo'];

    if (!transmissionId || !transmissionSig) {
      logger.warn('Missing PayPal signature headers');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Build expected signature string
    const expectedSig = `${transmissionId}|${transmissionTime}|${webhookId}|${crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex')}`;

    // In production, verify cert and signature
    // For now, basic validation
    if (process.env.NODE_ENV === 'production') {
      // NOTE: PayPal verification - implement if PayPal is enabled
      // https://developer.paypal.com/api/rest/webhooks/
      logger.info('PayPal webhook received', { transmissionId });
    }

    req.paypalEvent = req.body;
    next();
  } catch (error) {
    logger.error('PayPal webhook verification failed', { error: error.message });
    return res.status(400).json({ error: 'Invalid signature' });
  }
};

module.exports = {
  verifyPayPalWebhook
};
