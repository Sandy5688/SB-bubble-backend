const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { paymentLimiter } = require('../middleware/security');

/**
 * @route   POST /api/v1/pay/stripe/create
 * @desc    Create Stripe payment
 * @access  Private
 */
router.post('/stripe/create', paymentLimiter, paymentController.createStripePayment);

/**
 * @route   POST /api/v1/pay/paypal/create
 * @desc    Create PayPal payment
 * @access  Private
 */
router.post('/paypal/create', paymentLimiter, paymentController.createPayPalPayment);

/**
 * @route   POST /api/v1/pay/confirm
 * @desc    Confirm payment
 * @access  Private
 */
router.post('/confirm', paymentController.confirmPayment);

/**
 * @route   POST /api/v1/pay/refund/:transactionId
 * @desc    Refund payment
 * @access  Private
 */
router.post('/refund/:transactionId', paymentController.refundPayment);

/**
 * @route   GET /api/v1/pay/transaction/:transactionId
 * @desc    Get transaction details
 * @access  Private
 */
router.get('/transaction/:transactionId', paymentController.getTransaction);

/**
 * @route   POST /api/v1/pay/webhook/stripe
 * @desc    Stripe webhook handler
 * @access  Public (verified by signature)
 */
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

module.exports = router;
