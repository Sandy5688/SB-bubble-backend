const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messaging.controller');
const { validateApiKey, authenticate } = require('../middleware/security');
const rateLimit = require('express-rate-limit');
const env = require('../config/env');

// Messaging rate limiter (10 per minute)
const messagingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many messages sent, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip Redis store in test mode
  ...((env.NODE_ENV !== 'test' && env.REDIS_URL) && {
    store: new (require('rate-limit-redis'))({
      client: require('../config/redis'),
      prefix: 'rl:msg:'
    })
  })
});

/**
 * @route   POST /api/v1/msg/email
 * @desc    Send email message
 * @access  Private (requires API key + JWT)
 */
router.post('/email',
  validateApiKey,
  authenticate,
  messagingLimiter,
  messagingController.sendEmail
);

/**
 * @route   POST /api/v1/msg/sms
 * @desc    Send SMS message
 * @access  Private (requires API key + JWT)
 */
router.post('/sms',
  validateApiKey,
  authenticate,
  messagingLimiter,
  messagingController.sendSMS
);

module.exports = router;
