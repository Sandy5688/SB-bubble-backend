const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { AppError } = require('./errorHandler');
const crypto = require('crypto');

// Helmet configuration
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration
const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new AppError('Not allowed by CORS', 403));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { status: 'error', message },
    standardHeaders: true,
    legacyHeaders: false
  });
};

const generalLimiter = createRateLimiter(
  env.RATE_LIMIT_WINDOW_MS,
  env.RATE_LIMIT_MAX_REQUESTS,
  'Too many requests from this IP, please try again later'
);

const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests
  'Too many authentication attempts, please try again later'
);

const paymentLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10, // 10 requests
  'Too many payment requests, please slow down'
);

const aiLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  20, // 20 requests
  'Too many AI requests, please slow down'
);

// Internal API key validation
const validateInternalApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return next(new AppError('API key is required', 401));
  }

  if (apiKey !== env.INTERNAL_API_KEY) {
    return next(new AppError('Invalid API key', 403));
  }

  next();
};

// Request signature validation (for webhooks)
const validateWebhookSignature = (secret) => {
  return (req, res, next) => {
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];

    if (!signature || !timestamp) {
      return next(new AppError('Missing signature or timestamp', 401));
    }

    // Check timestamp (prevent replay attacks - 5 min window)
    const currentTime = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp);

    if (Math.abs(currentTime - requestTime) > 300) {
      return next(new AppError('Request timestamp expired', 401));
    }

    // Verify signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    if (signature !== expectedSignature) {
      return next(new AppError('Invalid signature', 403));
    }

    next();
  };
};

module.exports = {
  helmetConfig,
  corsOptions: cors(corsOptions),
  generalLimiter,
  authLimiter,
  paymentLimiter,
  aiLimiter,
  validateInternalApiKey,
  validateWebhookSignature
};
