const paymentService = require('../services/payment.service');
const { AppError } = require('../middleware/errorHandler');

class PaymentController {
  async createStripePayment(req, res, next) {
    try {
      const userId = req.user.id;
      const { amount, currency, metadata } = req.body;

      if (!amount) {
        throw new AppError('Amount is required', 400);
      }

      const result = await paymentService.createStripePayment(userId, amount, currency, metadata);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async createPayPalPayment(req, res, next) {
    try {
      const userId = req.user.id;
      const { amount, currency, metadata } = req.body;

      if (!amount) {
        throw new AppError('Amount is required', 400);
      }

      const result = await paymentService.createPayPalPayment(userId, amount, currency, metadata);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmPayment(req, res, next) {
    try {
      const { payment_intent_id } = req.body;

      if (!payment_intent_id) {
        throw new AppError('Payment intent ID is required', 400);
      }

      const result = await paymentService.confirmStripePayment(payment_intent_id);

      res.status(200).json({
        status: 'success',
        data: { payment: result }
      });
    } catch (error) {
      next(error);
    }
  }

  async refundPayment(req, res, next) {
    try {
      const { transactionId } = req.params;
      const { amount } = req.body;

      const result = await paymentService.refundPayment(transactionId, amount);

      res.status(200).json({
        status: 'success',
        data: { refund: result }
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransaction(req, res, next) {
    try {
      const userId = req.user.id;
      const { transactionId } = req.params;

      const transaction = await paymentService.getTransaction(transactionId, userId);

      res.status(200).json({
        status: 'success',
        data: { transaction }
      });
    } catch (error) {
      next(error);
    }
  }

  async stripeWebhook(req, res, next) {
    try {
      const signature = req.headers['stripe-signature'];
      const payload = req.body;

      await paymentService.handleStripeWebhook(payload, signature);

      res.status(200).json({ received: true });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
