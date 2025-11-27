const { doubleCsrf } = require('csrf-csrf');
const cookieParser = require('cookie-parser');
const env = require('../config/env');

// Configure double CSRF protection
const { 
  invalidCsrfTokenError,
  generateToken,
  validateRequest,
  doubleCsrfProtection 
} = doubleCsrf({
  getSecret: () => env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  cookieName: 'bubble.csrf',
  cookieOptions: {
    sameSite: 'lax',
    path: '/',
    secure: env.NODE_ENV === 'production',
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => req.headers['x-csrf-token'] || req.body.csrfToken,
});

// Export middleware
const csrfProtection = doubleCsrfProtection;

// Export token generation endpoint
const getCsrfToken = (req, res) => {
  try {
    const csrfToken = generateToken(req, res);
    res.json({ 
      csrfToken: csrfToken,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    // Fallback: return a simple token for now
    const fallbackToken = require('crypto').randomBytes(32).toString('hex');
    res.json({ 
      csrfToken: fallbackToken,
      message: 'CSRF token generated (fallback)'
    });
  }
};

module.exports = {
  cookieParserMiddleware: cookieParser(),
  csrfProtection,
  getCsrfToken,
};
