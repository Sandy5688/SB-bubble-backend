const crypto = require('crypto');
const { createLogger } = require('../config/monitoring');

const logger = createLogger('hmac-validation');

// Public routes that don't require HMAC
const PUBLIC_ROUTES = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/signin',
  '/api/v1/auth/signup',
  '/api/v1/auth/logout',
  '/api/v1/auth/signout',
  '/api/v1/auth/refresh',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/google/start',
  '/api/v1/auth/google/callback',
  '/api/v1/auth/apple/start',
  '/api/v1/auth/apple/callback',
  '/api/v1/auth/csrf-token',
  '/api/v1/auth/magic',
  '/api/v1/health',
  '/api/v1/pay/webhook' // Stripe has its own signature
];

/**
 * Validate HMAC signature for protected routes
 */
function validateHMAC(req, res, next) {
  const path = req.path;
  
  // Skip HMAC for public routes
  if (PUBLIC_ROUTES.some(route => path.startsWith(route))) {
    return next();
  }

  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  
  if (!signature || !timestamp) {
    logger.warn('Missing HMAC headers', { path });
    return res.status(401).json({
      status: 'error',
      code: 401,
      message: `Missing ${!signature ? 'x-signature' : 'x-timestamp'} header`
    });
  }

  // Validate timestamp (prevent replay attacks)
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  const MAX_AGE = 5 * 60 * 1000; // 5 minutes

  if (Math.abs(now - requestTime) > MAX_AGE) {
    logger.warn('HMAC timestamp too old', { path, age: Math.abs(now - requestTime) });
    return res.status(401).json({
      status: 'error',
      code: 401,
      message: 'Request timestamp expired'
    });
  }

  // Verify signature
  const secret = process.env.HMAC_SECRET;
  if (!secret) {
    logger.error('HMAC_SECRET not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const payload = `${timestamp}.${req.method}.${req.path}.${JSON.stringify(req.body)}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    logger.warn('Invalid HMAC signature', { path });
    return res.status(401).json({
      status: 'error',
      code: 401,
      message: 'Invalid signature'
    });
  }

  next();
}

module.exports = { validateHMAC };
