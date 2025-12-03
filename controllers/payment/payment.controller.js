const stripeService = require('../../services/payment/stripe.service');
const { query } = require('../../config/database');
const { createLogger } = require('../../config/monitoring');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const stripeIdempotency = require('../../services/payment/stripe-idempotency.service');
const logger = createLogger('payment-controller');


const createCustomer = async (req, res) => {
  try {
    const { billingEmail } = req.body;
    const email = billingEmail || req.user.email;
    const userId = req.userId || req.user.id;
    
    // Check existing
    const existing = await query(
      'SELECT * FROM payment_customers WHERE user_id = $1',
      [userId]
    );
    if (existing.rows.length > 0) {
      return res.json({ success: true, data: existing.rows[0] });
    }
    
    // Use idempotent creation
    const customer = await stripeIdempotency.createCustomerIdempotent(email, userId);
    
    // Store in DB
    await query(
      `INSERT INTO payment_customers (user_id, stripe_customer_id, email, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, customer.id, email]
    );
    
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    logger.error('Failed to create customer', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to create customer' });
  }
};
const addPaymentMethod = async (req, res) => {
  try {
    const customer = await query(
      'SELECT id FROM payment_customers WHERE user_id = $1',
      [req.userId]
    );

    if (customer.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const result = await stripeService.createSetupIntent(customer.rows[0].id);

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to add payment method', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to add payment method' });
  }
};


const createSubscription = async (req, res) => {
  try {
    const { priceId } = req.body;
    const userId = req.userId || req.user.id;
    
    // Check duplicate
    await stripeIdempotency.checkDuplicateSubscription(userId, priceId);
    
    // Get customer
    const customerResult = await query(
      'SELECT stripe_customer_id FROM payment_customers WHERE user_id = $1',
      [userId]
    );
    
    if (customerResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Create customer first' });
    }
    
    const customerId = customerResult.rows[0].stripe_customer_id;
    
    // Create with idempotency
    const subscription = await stripeIdempotency.createSubscriptionIdempotent(
      customerId,
      priceId,
      userId
    );
    
    res.json({ success: true, data: subscription });
  } catch (error) {
    logger.error('Failed to create subscription', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};
const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { immediate } = req.body;

    const subscription = await query(
      'SELECT * FROM subscriptions WHERE stripe_subscription_id = $1 AND user_id = $2',
      [subscriptionId, req.userId]
    );

    if (subscription.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    const result = await stripeService.cancelSubscription(subscriptionId, immediate);

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to cancel subscription', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to cancel subscription' });
  }
};

const getSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const result = await query(
      'SELECT * FROM subscriptions WHERE stripe_subscription_id = $1 AND user_id = $2',
      [subscriptionId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Failed to get subscription', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to get subscription' });
  }
};

const handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    await stripeService.handleWebhookEvent(event);

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook error', { error: error.message });
    res.status(400).json({ success: false, error: 'Webhook error' });
  }
};

module.exports = {
  createCustomer,
  addPaymentMethod,
  createSubscription,
  cancelSubscription,
  getSubscription,
  handleWebhook,
};

// Legacy payment methods (not implemented yet, return 501)
module.exports.createStripePayment = async (req, res) => {
  res.status(501).json({ success: false, message: 'Use /create-customer and /create-subscription instead' });
};

module.exports.createPayPalPayment = async (req, res) => {
  res.status(501).json({ success: false, message: 'PayPal not implemented yet' });
};

module.exports.confirmPayment = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

module.exports.refundPayment = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

module.exports.getTransaction = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

module.exports.stripeWebhook = async (req, res) => {
  try {
    const event = req.stripeEvent;
    
    // Validate event age (defense in depth)
    const eventAge = Date.now() - (event.created * 1000);
    const MAX_EVENT_AGE = 5 * 60 * 1000; // 5 minutes
    
    if (eventAge > MAX_EVENT_AGE) {
      console.warn("Webhook event too old", { eventId: event.id, ageSeconds: Math.floor(eventAge / 1000) });
      return res.status(400).json({ error: "Event too old" });
    }
    
    // TODO: Implement webhook handling
    res.status(501).json({ success: false, message: 'Webhook not implemented yet' });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Internal error" });
  }
};

module.exports.paypalWebhook = async (req, res) => {
  res.status(501).json({ success: false, message: 'PayPal not implemented yet' });
};

/**
 * Record billing consent
 */
const recordBillingConsent = async (req, res) => {
  try {
    const userId = req.userId;
    const { consentVersion, termsAccepted } = req.body;

    if (!termsAccepted) {
      return res.status(400).json({ 
        success: false, 
        error: 'Terms must be accepted' 
      });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Update user billing consent
    await query(
      `UPDATE users 
       SET billing_consent = TRUE, 
           last_billing_consent_at = NOW() 
       WHERE id = $1`,
      [userId]
    );

    // Log to audit trail
    await query(
      `INSERT INTO kyc_audit_logs (user_id, action, details, timestamp)
       VALUES ($1, 'billing_consent_granted', $2, NOW())`,
      [
        userId,
        JSON.stringify({
          consentVersion: consentVersion || 'v1.0',
          ip,
          userAgent,
          timestamp: new Date().toISOString()
        })
      ]
    );

    logger.info('Billing consent recorded', { userId });

    res.json({
      success: true,
      message: 'Billing consent recorded successfully'
    });
  } catch (error) {
    logger.error('Record billing consent failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to record consent' });
  }
};

module.exports.recordBillingConsent = recordBillingConsent;

const activateGraceTier = async (req, res) => {
  try {
    const userId = req.user.id;
    const tierService = require('../../services/payment/subscription-tier.service');

    const result = await tierService.activateGraceTier(userId);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.reason });
    }

    res.json({ success: true, tier: result.tier, message: 'Grace tier activated' });
  } catch (error) {
    logger.error('Grace tier activation failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports.activateGraceTier = activateGraceTier;
