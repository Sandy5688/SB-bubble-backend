const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  // Generate unique request ID
  req.id = uuidv4();
  
  // Log incoming request
  logger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Log response
  const originalSend = res.send;
  res.send = function (data) {
    logger.info('Outgoing response', {
      requestId: req.id,
      statusCode: res.statusCode,
      path: req.path
    });
    originalSend.call(this, data);
  };

  next();
};

module.exports = requestLogger;
