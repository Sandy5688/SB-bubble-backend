const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/payment/payment.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireValidKYC } = require('../../middleware/kyc.middleware');
const { verifyStripeWebhook, checkDuplicateEvent } = require('../../middleware/stripe-webhook.middleware');

// Grace tier (no KYC required)
router.post('/grace-activate', authenticate, paymentController.activateGraceTier);

// All other payment routes require authentication + valid KYC
router.use(authenticate);
router.use(requireValidKYC);

// Customer & Subscription Management
router.post('/create-customer', paymentController.createCustomer);
router.post('/add-payment-method', paymentController.addPaymentMethod);
router.post('/create-subscription', paymentController.createSubscription);
router.post('/cancel-subscription/:subscriptionId', paymentController.cancelSubscription);
router.get('/subscription/:subscriptionId', paymentController.getSubscription);

// Webhooks (no auth/KYC required - verified by signature)
router.post('/webhook', 
  express.raw({ type: 'application/json' }), 
  verifyStripeWebhook,
  checkDuplicateEvent,
  paymentController.handleWebhook
);

module.exports = router;
