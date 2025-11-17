const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

/**
 * @route   GET /api/v1/user/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', userController.getProfile);

/**
 * @route   PUT /api/v1/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', userController.updateProfile);

/**
 * @route   GET /api/v1/user/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', userController.getStats);

/**
 * @route   DELETE /api/v1/user/deactivate
 * @desc    Deactivate user account
 * @access  Private
 */
router.delete('/deactivate', userController.deactivate);

module.exports = router;
