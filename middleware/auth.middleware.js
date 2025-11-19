const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Real JWT Authentication Middleware
 * Validates JWT tokens and attaches user to request
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Authentication required - No token provided'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify JWT token
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // Attach user to request
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role || 'user'
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Invalid token'
      });
    }

    return res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Authentication error'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, env.JWT_SECRET);
      
      req.user = {
        id: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role || 'user'
      };
    }
    
    next();
  } catch (error) {
    // Silent fail - just don't attach user
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
};
