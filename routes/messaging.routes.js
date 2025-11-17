const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messaging.controller');

/**
 * @route   POST /api/v1/msg/email
 * @desc    Send email
 * @access  Private
 */
router.post('/email', messagingController.sendEmail);

/**
 * @route   POST /api/v1/msg/sms
 * @desc    Send SMS
 * @access  Private
 */
router.post('/sms', messagingController.sendSMS);

/**
 * @route   GET /api/v1/msg/:messageId
 * @desc    Get message status
 * @access  Private
 */
router.get('/:messageId', messagingController.getMessageStatus);

module.exports = router;
