const express = require('express');
const router = express.Router();
const { validateInternalApiKey } = require('../middleware/security');
const authService = require('../services/auth.service');
const { AppError } = require('../middleware/errorHandler');

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const fileRoutes = require('./file.routes');
const paymentRoutes = require('./payment.routes');
const messagingRoutes = require('./messaging.routes');
const aiRoutes = require('./ai.routes');
const workflowRoutes = require('./workflow.routes');
const healthRoutes = require('./health.routes');

// Authentication middleware for protected routes
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const user = await authService.getUserByToken(token);
    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401));
  }
};

// Health check (public)
router.use('/health', healthRoutes);

// Auth routes (public with rate limiting)
router.use('/auth', authRoutes);

// Apply internal API key validation and authentication to all other routes
router.use(validateInternalApiKey);
router.use(authenticate);

// Protected routes
router.use('/user', userRoutes);
router.use('/files', fileRoutes);
router.use('/pay', paymentRoutes);
router.use('/msg', messagingRoutes);
router.use('/ai', aiRoutes);
router.use('/flow', workflowRoutes);

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

module.exports = router;
