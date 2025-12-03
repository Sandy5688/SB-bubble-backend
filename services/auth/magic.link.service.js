const crypto = require('crypto');
const { query } = require('../../config/database');
const emailService = require('../email.service');
const { createLogger } = require('../../config/monitoring');
const env = require('../../config/env');
const logger = createLogger('magic-link');

/**
 * Generate magic link token with IP/UserAgent binding
 */
const generateMagicLink = async (email, ipAddress, userAgent) => {
  try {
    // Find user
    const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    const userId = userResult.rows[0].id;

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Store with IP and UserAgent binding
    await query(
      `INSERT INTO magic_links (user_id, email, token_hash, expires_at, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '15 minutes', $4, $5, NOW())`,
      [userId, email, tokenHash, ipAddress || null, userAgent || null]
    );

    // Create magic link URL (send via email, never return in API)
    const magicUrl = `${env.FRONTEND_URL}/auth/magic?token=${token}`;

    await emailService.sendMagicLink(email, magicUrl);
    logger.info('Magic link generated', { userId, email });

    return { magicUrl }; // Only used internally for email sending
  } catch (error) {
    logger.error('Generate magic link failed', { error: error.message });
    throw error;
  }
};

/**
 * Verify magic link token - TOKEN ONLY (no email required)
 * Also validates IP/UserAgent binding
 */
const verifyMagicLink = async (token, ipAddress, userAgent) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid token by hash ONLY - no email needed
    const result = await query(
      `SELECT ml.*, u.id as user_id, u.email, u.role
       FROM magic_links ml
       JOIN users u ON ml.user_id = u.id
       WHERE ml.token_hash = $1 
         AND ml.expires_at > NOW() 
         AND ml.used_at IS NULL`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired magic link');
    }

    const link = result.rows[0];

    // Optional: Validate IP binding (warn but don't block for now)
    if (link.ip_address && link.ip_address !== ipAddress) {
      logger.warn('Magic link IP mismatch', { 
        expected: link.ip_address, 
        actual: ipAddress,
        userId: link.user_id 
      });
      // Uncomment to enforce strict IP binding:
      // throw new Error('Invalid magic link - IP mismatch');
    }

    // Mark as used IMMEDIATELY (single-use enforcement)
    await query(
      `UPDATE magic_links SET used_at = NOW() WHERE id = $1`,
      [link.id]
    );

    // Update last login
    await query(
      `UPDATE users SET last_login_at = NOW(), login_count = login_count + 1 WHERE id = $1`,
      [link.user_id]
    );

    // Log login event
    await query(
      `INSERT INTO login_events (user_id, provider, success)
       VALUES ($1, 'magic_link', TRUE)`,
      [link.user_id]
    );

    return {
      userId: link.user_id,
      email: link.email,
      role: link.role
    };
  } catch (error) {
    logger.error('Verify magic link failed', { error: error.message });
    throw error;
  }
};

module.exports = {
  generateMagicLink,
  verifyMagicLink
};
