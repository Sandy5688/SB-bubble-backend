const { createLogger } = require('../config/monitoring');
const logger = createLogger('rbac-middleware');

/**
 * Check if user has required role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = req.user.role || 'user';
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.warn('Unauthorized role access attempt', {
        userId: req.user.id,
        userRole,
        requiredRoles: allowedRoles,
        path: req.path
      });

      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Check if user owns the resource
 */
const requireOwnership = (userIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const resourceUserId = req.params[userIdParam] || req.body.userId || req.query.userId;
    
    // Admin can access anything
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only access their own resources
    if (resourceUserId !== req.user.id) {
      logger.warn('IDOR attempt detected', {
        userId: req.user.id,
        attemptedAccess: resourceUserId,
        path: req.path
      });

      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
  requireOwnership
};
