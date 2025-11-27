const { createLogger } = require('../config/monitoring');
const logger = createLogger('validation');

/**
 * Generic body validation middleware
 */
const validateBody = (requiredFields) => {
  return (req, res, next) => {
    const missing = requiredFields.filter(field => !req.body[field]);
    
    if (missing.length > 0) {
      logger.warn('Validation failed', { missing, body: req.body });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missing
      });
    }
    
    next();
  };
};

/**
 * Email validation
 */
const validateEmail = (req, res, next) => {
  const { email } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (email && !emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
  }
  
  next();
};

/**
 * UUID validation for params
 */
const validateUUID = (paramName) => {
  return (req, res, next) => {
    const value = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (value && !uuidRegex.test(value)) {
      return res.status(400).json({
        success: false,
        error: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

module.exports = {
  validateBody,
  validateEmail,
  validateUUID
};
