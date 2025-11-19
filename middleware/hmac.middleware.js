const crypto = require('crypto');
const env = require('../config/env');

/**
 * HMAC Request Signature Validation
 * Prevents replay attacks and ensures request integrity
 */
const validateHmacSignature = (req, res, next) => {
  try {
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    const apiKey = req.headers['x-api-key'];

    // Check required headers
    if (!signature) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Missing x-signature header'
      });
    }

    if (!timestamp) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Missing x-timestamp header'
      });
    }

    if (!apiKey) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Missing x-api-key header'
      });
    }

    // Validate timestamp (prevent replay attacks - 5 minute window)
    const requestTime = parseInt(timestamp);
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - requestTime);
    
    if (timeDiff > 5 * 60 * 1000) { // 5 minutes
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Request timestamp expired (replay attack prevention)'
      });
    }

    // Validate API key first
    if (apiKey !== env.INTERNAL_API_KEY) {
      return res.status(403).json({
        status: 'error',
        code: 403,
        message: 'Invalid API key'
      });
    }

    // Create signature payload
    const method = req.method;
    const path = req.originalUrl;
    const body = req.body ? JSON.stringify(req.body) : '';
    
    const payload = `${method}${path}${timestamp}${body}`;

    // Generate HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', env.HMAC_SECRET)
      .update(payload)
      .digest('hex');

    // Compare signatures (timing-safe comparison)
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      return res.status(403).json({
        status: 'error',
        code: 403,
        message: 'Invalid signature'
      });
    }

    if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return res.status(403).json({
        status: 'error',
        code: 403,
        message: 'Invalid signature'
      });
    }

    // Signature valid
    next();
  } catch (error) {
    console.error('HMAC validation error:', error);
    return res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Signature validation error'
    });
  }
};

module.exports = {
  validateHmacSignature
};
