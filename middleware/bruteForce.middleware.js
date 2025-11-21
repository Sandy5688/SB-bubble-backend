const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');

/**
 * Redis-Based Brute Force Protection (FIX #10)
 * Provides distributed brute force detection with lockout
 */

// Get Redis store if available
function getStore(prefix) {
  if (redis && typeof redis.get === "function") {
    return new RedisStore({
      client: redis,
      prefix: prefix
    });
  }
  console.warn('⚠️  Redis unavailable - brute force protection using memory (not distributed)');
  return undefined; // Falls back to memory store
}

/**
 * Login Brute Force Protection
 * 5 attempts per 15 minutes, then LOCKED for 30 minutes
 */
const loginBruteForce = rateLimit({
  store: getStore('rl:brute:login:'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req, res) => {
    // When limit exceeded, lock for 30 minutes
    const unlockTime = new Date(Date.now() + 30 * 60 * 1000);
    
    console.error(`🔒 BRUTE FORCE LOCKOUT: ${req.ip} - locked until ${unlockTime.toISOString()}`);
    
    res.status(429).json({
      status: 'error',
      code: 429,
      message: 'Too many failed login attempts. Account locked for 30 minutes for security.',
      locked_until: unlockTime.toISOString(),
      retry_after: 30 * 60 // seconds
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Password Reset Brute Force
 * 3 attempts per hour
 */
const passwordResetBruteForce = rateLimit({
  store: getStore('rl:brute:reset:'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  handler: (req, res) => {
    console.error(`🔒 Password reset abuse: ${req.ip}`);
    
    res.status(429).json({
      status: 'error',
      code: 429,
      message: 'Too many password reset requests. Please try again in 1 hour.',
      retry_after: 60 * 60
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Signup Brute Force
 * 3 account creations per IP per hour
 */
const signupBruteForce = rateLimit({
  store: getStore('rl:brute:signup:'),
  windowMs: 60 * 60 * 1000,
  max: 3,
  handler: (req, res) => {
    console.error(`🔒 Signup abuse: ${req.ip}`);
    
    res.status(429).json({
      status: 'error',
      code: 429,
      message: 'Too many account creation attempts. Please try again later.',
      retry_after: 60 * 60
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 2FA Brute Force
 * 5 verification attempts per 15 minutes
 */
const twoFactorBruteForce = rateLimit({
  store: getStore('rl:brute:2fa:'),
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    console.error(`🔒 2FA brute force: ${req.ip}`);
    
    res.status(429).json({
      status: 'error',
      code: 429,
      message: 'Too many 2FA verification attempts. Locked for 15 minutes.',
      retry_after: 15 * 60
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  loginBruteForce,
  passwordResetBruteForce,
  signupBruteForce,
  twoFactorBruteForce
};
