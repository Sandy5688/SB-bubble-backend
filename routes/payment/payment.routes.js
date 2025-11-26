const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/payment/payment.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { verifyStripeWebhook, checkDuplicateEvent } = require('../../middleware/stripe-webhook.middleware');

// Customer & Subscription Management
router.post('/create-customer', authenticate, paymentController.createCustomer);
router.post('/add-payment-method', authenticate, paymentController.addPaymentMethod);
router.post('/create-subscription', authenticate, paymentController.createSubscription);
router.post('/cancel-subscription/:subscriptionId', authenticate, paymentController.cancelSubscription);
router.get('/subscription/:subscriptionId', authenticate, paymentController.getSubscription);

// Webhooks with signature verification + deduplication
router.post('/webhook', 
  express.raw({ type: 'application/json' }), 
  verifyStripeWebhook,
  checkDuplicateEvent,
  paymentController.handleWebhook
);

module.exports = router;
