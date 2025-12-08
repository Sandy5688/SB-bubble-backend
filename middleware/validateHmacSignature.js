const crypto = require('crypto');
const { pool } = require('../config/database');
const { createLogger } = require('../config/monitoring');
const logger = createLogger('hmac-middleware');

// Public routes that don't require HMAC
const PUBLIC_ROUTES = [
  '/api/v1/health',
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/magic-link',
  '/api/v1/auth/verify-magic-link',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/confirm-reset',
  '/api/v1/auth/google/callback',
  '/api/v1/auth/apple/callback',
  '/api/v1/auth/apple/start',
];

/**
 * Normalize request path with sorted query parameters
 */
function normalizePath(req) {
  try {
    const url = new URL(req.originalUrl, 'http://example.com');
    const pathname = url.pathname;
    const params = new URLSearchParams(url.search);
    const sorted = [...params.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const query = sorted.length ? '?' + sorted.map(p => `${p[0]}=${p[1]}`).join('&') : '';
    return pathname + query;
  } catch (err) {
    logger.error('Path normalization failed', { error: err.message });
    return req.path;
  }
}

/**
 * Canonicalize request body for hashing
 * MUST produce deterministic output (sorted JSON keys)
 */
function canonicalizeBody(req) {
  const contentType = (req.headers['content-type'] || '').split(';')[0].trim();
  
  // No body or empty body
  if (!req.body || Object.keys(req.body).length === 0) {
    return crypto.createHash('sha256').update('').digest('hex');
  }

  // JSON body - sort keys recursively
  if (contentType === 'application/json') {
    const ordered = (obj) => {
      if (Array.isArray(obj)) return obj.map(ordered);
      if (obj && typeof obj === 'object') {
        return Object.keys(obj).sort().reduce((result, key) => {
          result[key] = ordered(obj[key]);
          return result;
        }, {});
      }
      return obj;
    };
    
    const minified = JSON.stringify(ordered(req.body));
    return crypto.createHash('sha256').update(minified).digest('hex');
  }

  // Raw body (webhooks)
  if (req.rawBody) {
    return crypto.createHash('sha256').update(req.rawBody).digest('hex');
  }

  // File upload with x-file-sha256 header
  if (req.headers['x-file-sha256']) {
    return req.headers['x-file-sha256'];
  }

  // Default to empty
  return crypto.createHash('sha256').update('').digest('hex');
}

/**
 * Fetch API key from database
 */
async function fetchApiKey(keyId) {
  try {
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE key_id = $1 AND disabled = false',
      [keyId]
    );
    return result.rows[0] || null;
  } catch (err) {
    logger.error('API key fetch failed', { error: err.message, keyId });
    return null;
  }
}

/**
 * Decrypt secret for API key
 * TODO: Implement KMS decryption or use encrypted env vars
 */
async function decryptSecretForApiKey(apiKey) {
  // For now, return the stored secret (should be encrypted in production)
  // In production: use AWS KMS, Google KMS, or Azure Key Vault
  
  if (process.env[`API_KEY_SECRET_${apiKey.key_id}`]) {
    return process.env[`API_KEY_SECRET_${apiKey.key_id}`];
  }
  
  // Fallback: stored secret (MUST be encrypted in production)
  return apiKey.secret_hash;
}

/**
 * Check nonce for replay attack prevention
 */
async function checkNonce(keyId, nonce) {
  try {
    // Try Redis first if available
    if (global.redisClient && global.redisClient.isReady) {
      const nonceKey = `hmac:nonce:${keyId}:${nonce}`;
      const exists = await global.redisClient.get(nonceKey);
      
      if (exists) {
        return false; // Replay detected
      }
      
      // Store nonce with 300s TTL
      await global.redisClient.set(nonceKey, '1', { EX: 300 });
      return true;
    }
    
    // Fallback to database
    const result = await pool.query(
      'INSERT INTO hmac_nonces (key_id, nonce) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [keyId, nonce]
    );
    
    // If no rows returned, nonce already existed (replay)
    return result.rowCount > 0;
    
  } catch (err) {
    logger.error('Nonce check failed', { error: err.message, keyId, nonce });
    return false;
  }
}

/**
 * Log HMAC verification event
 */
async function logHmacEvent(apiKeyId, req, success, failureReason = null) {
  try {
    await pool.query(
      `INSERT INTO hmac_events (api_key_id, path, method, timestamp, client_ip, success, failure_reason)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6)`,
      [
        apiKeyId,
        req.path,
        req.method,
        req.ip || req.connection.remoteAddress,
        success,
        failureReason
      ]
    );
  } catch (err) {
    logger.error('Failed to log HMAC event', { error: err.message });
  }
}

/**
 * Check if route is public (no HMAC required)
 */
function isPublicRoute(path) {
  return PUBLIC_ROUTES.some(route => path.startsWith(route));
}

/**
 * Main HMAC verification middleware
 */
async function validateHmacSignature(req, res, next) {
  // Skip public routes
  if (isPublicRoute(req.path)) {
    return next();
  }

  try {
    // 1. Extract headers
    const keyId = req.headers['x-api-key'];
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    const nonce = req.headers['x-nonce'];

    // 2. Check required headers
    if (!keyId || !signature || !timestamp || !nonce) {
      logger.warn('Missing HMAC headers', { path: req.path, keyId });
      return res.status(401).json({
        success: false,
        code: 'HMAC_MISSING',
        message: 'Missing required HMAC header'
      });
    }

    // 3. Validate timestamp
    const tsDate = isNaN(Number(timestamp)) 
      ? new Date(timestamp) 
      : new Date(Number(timestamp) * 1000);
    
    const now = new Date();
    const timeDiff = Math.abs((now - tsDate) / 1000);
    
    if (timeDiff > 300) {
      logger.warn('HMAC timestamp outside window', { 
        path: req.path, 
        timeDiff,
        keyId 
      });
      
      await logHmacEvent(null, req, false, 'HMAC_TIMESTAMP');
      
      return res.status(401).json({
        success: false,
        code: 'HMAC_TIMESTAMP',
        message: 'Timestamp outside allowed window'
      });
    }

    // 4. Fetch API key
    const apiKey = await fetchApiKey(keyId);
    
    if (!apiKey) {
      logger.warn('Invalid API key', { keyId, path: req.path });
      await logHmacEvent(null, req, false, 'HMAC_APIKEY_INVALID');
      
      return res.status(403).json({
        success: false,
        code: 'HMAC_APIKEY_INVALID',
        message: 'Invalid API key'
      });
    }

    // 5. Check nonce (replay prevention)
    const nonceValid = await checkNonce(keyId, nonce);
    
    if (!nonceValid) {
      logger.warn('Replay attack detected', { keyId, nonce, path: req.path });
      await logHmacEvent(apiKey.id, req, false, 'HMAC_REPLAY');
      
      return res.status(401).json({
        success: false,
        code: 'HMAC_REPLAY',
        message: 'Replay detected (nonce reuse)'
      });
    }

    // 6. Compute canonical string
    const bodyHash = canonicalizeBody(req);
    const normalizedPath = normalizePath(req);
    const canonical = `${req.method.toUpperCase()}\n${normalizedPath}\n${keyId}\n${timestamp}\n${nonce}\n${bodyHash}`;

    // 7. Get secret and compute HMAC
    const secret = await decryptSecretForApiKey(apiKey);
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(canonical)
      .digest('hex');

    // 8. Constant-time comparison
    const providedBuffer = Buffer.from(signature, 'hex');
    const computedBuffer = Buffer.from(computedSignature, 'hex');

    if (providedBuffer.length !== computedBuffer.length || 
        !crypto.timingSafeEqual(providedBuffer, computedBuffer)) {
      
      logger.warn('HMAC signature mismatch', { 
        keyId, 
        path: req.path,
        method: req.method 
      });
      
      await logHmacEvent(apiKey.id, req, false, 'HMAC_MISMATCH');
      
      return res.status(401).json({
        success: false,
        code: 'HMAC_MISMATCH',
        message: 'Signature verification failed'
      });
    }

    // 9. Success - attach client info
    req.clientId = apiKey.id;
    req.apiKeyMeta = apiKey;
    
    await logHmacEvent(apiKey.id, req, true);
    
    logger.debug('HMAC verification successful', { 
      keyId, 
      path: req.path 
    });
    
    next();

  } catch (err) {
    logger.error('HMAC verification error', { 
      error: err.message, 
      stack: err.stack 
    });
    
    return res.status(401).json({
      success: false,
      code: 'HMAC_ERROR',
      message: 'HMAC verification failed'
    });
  }
}

module.exports = { validateHmacSignature, PUBLIC_ROUTES, isPublicRoute };
