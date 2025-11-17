const crypto = require('crypto');

/**
 * Generate random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Sanitize user input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Format currency
 */
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Generate idempotency key
 */
const generateIdempotencyKey = (userId, action) => {
  const timestamp = Date.now();
  return crypto
    .createHash('sha256')
    .update(`${userId}-${action}-${timestamp}`)
    .digest('hex');
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

/**
 * Sleep function (for retry logic)
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
};

/**
 * Paginate array
 */
const paginate = (array, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return {
    data: array.slice(offset, offset + limit),
    page,
    limit,
    total: array.length,
    totalPages: Math.ceil(array.length / limit)
  };
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Remove undefined/null values from object
 */
const cleanObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null)
  );
};

module.exports = {
  generateRandomString,
  sanitizeInput,
  formatCurrency,
  generateIdempotencyKey,
  isValidEmail,
  isValidPhone,
  sleep,
  retryWithBackoff,
  paginate,
  deepClone,
  cleanObject
};
