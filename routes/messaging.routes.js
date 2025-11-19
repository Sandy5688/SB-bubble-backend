const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messaging.controller');
const { validateEmail, validateSMS } = require('../validation/messaging.validation');
const rateLimit = require('express-rate-limit');

// Messaging-specific rate limiter (prevent spam)
const messagingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 messages per hour
  message: {
    status: 'error',
    code: 429,
    message: 'Too many messages sent. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use Redis if available
  ...(process.env.REDIS_URL && {
    store: require('rate-limit-redis')({
      client: require('../config/redis').getRedisClient(),
      prefix: 'rl:msg:'
    })
  })
});

// Email-specific stricter rate limit
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 emails per hour
  message: {
    status: 'error',
    code: 429,
    message: 'Too many emails sent. Please try again later.'
  }
});

// SMS-specific stricter rate limit
const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 SMS per hour (SMS is expensive!)
  message: {
    status: 'error',
    code: 429,
    message: 'Too many SMS sent. Please try again later.'
  }
});

/**
 * @route POST /api/v1/msg/email
 * @desc Send email (with validation & rate limiting)
 * @access Private
 */
router.post('/email', emailLimiter, validateEmail, messagingController.sendEmail);

/**
 * @route POST /api/v1/msg/sms
 * @desc Send SMS (with validation & rate limiting)
 * @access Private
 */
router.post('/sms', smsLimiter, validateSMS, messagingController.sendSMS);

/**
 * @route GET /api/v1/msg/:messageId
 * @desc Get message status
 * @access Private
 */
router.get('/:messageId', messagingLimiter, messagingController.getMessageStatus);

module.exports = router;
