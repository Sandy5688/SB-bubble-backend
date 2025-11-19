const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { validateUpdateProfile, validateDeactivate } = require('../validation/user.validation');
const rateLimit = require('express-rate-limit');

// Rate limiter for sensitive operations
const sensitiveOpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    status: 'error',
    code: 429,
    message: 'Too many attempts. Please try again later.'
  }
});

/**
 * @route GET /api/v1/user/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', userController.getProfile);

/**
 * @route PUT /api/v1/user/profile
 * @desc Update user profile (with validation & sanitization)
 * @access Private
 */
router.put('/profile', validateUpdateProfile, userController.updateProfile);

/**
 * @route GET /api/v1/user/stats
 * @desc Get user statistics
 * @access Private
 */
router.get('/stats', userController.getStats);

/**
 * @route DELETE /api/v1/user/deactivate
 * @desc Deactivate user account (with validation & rate limiting)
 * @access Private
 */
router.delete('/deactivate', sensitiveOpLimiter, validateDeactivate, userController.deactivate);

module.exports = router;
