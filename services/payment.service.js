const Stripe = require('stripe');
const axios = require('axios');
const { supabaseAdmin } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const env = require('../config/env');
const { v4: uuidv4 } = require('uuid');

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

class PaymentService {
  // Create Stripe payment intent
  async createStripePayment(userId, amount, currency = 'USD', metadata = {}) {
    try {
      const idempotencyKey = uuidv4();

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: { ...metadata, userId }
      }, {
        idempotencyKey
      });

      // Store transaction
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          transaction_type: 'payment',
          payment_provider: 'stripe',
          provider_transaction_id: paymentIntent.id,
          amount,
          currency,
          status: 'pending',
          metadata,
          idempotency_key: idempotencyKey
        })
        .select()
        .single();

      if (error) throw new AppError(error.message, 400);

      logger.info('Stripe payment created', { userId, transactionId: data.id, amount });

      return {
        transaction: data,
        clientSecret: paymentIntent.client_secret
      };
    } catch (error) {
      logger.error('Create Stripe payment error', { error: error.message });
      throw error;
    }
  }

  // Confirm Stripe payment
  async confirmStripePayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      const { error } = await supabaseAdmin
        .from('transactions')
        .update({
          status: paymentIntent.status === 'succeeded' ? 'completed' : paymentIntent.status
        })
        .eq('provider_transaction_id', paymentIntentId);

      if (error) throw new AppError(error.message, 400);

      logger.info('Stripe payment confirmed', { paymentIntentId, status: paymentIntent.status });

      return paymentIntent;
    } catch (error) {
      logger.error('Confirm Stripe payment error', { error: error.message });
      throw error;
    }
  }

  // Create PayPal order
  async createPayPalPayment(userId, amount, currency = 'USD', metadata = {}) {
    try {
      const idempotencyKey = uuidv4();

      // Get PayPal access token
      const authResponse = await axios.post(
        `https://api-m.${env.PAYPAL_MODE}.paypal.com/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          auth: {
            username: env.PAYPAL_CLIENT_ID,
            password: env.PAYPAL_CLIENT_SECRET
          }
        }
      );

      const accessToken = authResponse.data.access_token;

      // Create order
      const orderResponse = await axios.post(
        `https://api-m.${env.PAYPAL_MODE}.paypal.com/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: currency,
              value: amount.toFixed(2)
            }
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      // Store transaction
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          transaction_type: 'payment',
          payment_provider: 'paypal',
          provider_transaction_id: orderResponse.data.id,
          amount,
          currency,
          status: 'pending',
          metadata,
          idempotency_key: idempotencyKey
        })
        .select()
        .single();

      if (error) throw new AppError(error.message, 400);

      logger.info('PayPal payment created', { userId, transactionId: data.id, amount });

      return {
        transaction: data,
        orderId: orderResponse.data.id,
        approvalUrl: orderResponse.data.links.find(link => link.rel === 'approve')?.href
      };
    } catch (error) {
      logger.error('Create PayPal payment error', { error: error.message });
      throw error;
    }
  }

  // Refund payment
  async refundPayment(transactionId, amount = null) {
    try {
      const { data: transaction, error: fetchError } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError || !transaction) throw new AppError('Transaction not found', 404);

      if (transaction.status !== 'completed') {
        throw new AppError('Only completed transactions can be refunded', 400);
      }

      let refundResult;

      if (transaction.payment_provider === 'stripe') {
        refundResult = await stripe.refunds.create({
          payment_intent: transaction.provider_transaction_id,
          amount: amount ? Math.round(amount * 100) : undefined
        });
      } else if (transaction.payment_provider === 'paypal') {
        // PayPal refund logic would go here
        throw new AppError('PayPal refunds not yet implemented', 501);
      }

      // Create refund transaction record
      const { data: refundTransaction, error } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: transaction.user_id,
          transaction_type: 'refund',
          payment_provider: transaction.payment_provider,
          provider_transaction_id: refundResult.id,
          amount: amount || transaction.amount,
          currency: transaction.currency,
          status: 'completed',
          metadata: { original_transaction_id: transactionId }
        })
        .select()
        .single();

      if (error) throw new AppError(error.message, 400);

      // Update original transaction
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'refunded' })
        .eq('id', transactionId);

      logger.info('Payment refunded', { transactionId, refundId: refundTransaction.id });

      return refundTransaction;
    } catch (error) {
      logger.error('Refund payment error', { error: error.message });
      throw error;
    }
  }

  // Handle Stripe webhook
  async handleStripeWebhook(payload, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );

      // Store event
      await supabaseAdmin
        .from('payment_events')
        .insert({
          provider: 'stripe',
          event_type: event.type,
          event_id: event.id,
          payload: event.data.object
        });

      // Process event
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.confirmStripePayment(event.data.object.id);
          break;
        case 'payment_intent.payment_failed':
          await supabaseAdmin
            .from('transactions')
            .update({ status: 'failed' })
            .eq('provider_transaction_id', event.data.object.id);
          break;
      }

      logger.info('Stripe webhook processed', { eventType: event.type, eventId: event.id });

      return { success: true };
    } catch (error) {
      logger.error('Stripe webhook error', { error: error.message });
      throw error;
    }
  }

  // Get transaction by ID
  async getTransaction(transactionId, userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .single();

      if (error) throw new AppError('Transaction not found', 404);

      return data;
    } catch (error) {
      logger.error('Get transaction error', { error: error.message });
      throw error;
    }
  }
}

module.exports = new PaymentService();
