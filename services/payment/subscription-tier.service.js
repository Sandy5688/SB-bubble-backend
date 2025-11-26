const { query } = require('../../config/database');
const { createLogger } = require('../../config/monitoring');

const logger = createLogger('subscription-tier');

const TIERS = {
  GRACE: 'grace',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise'
};

/**
 * Activate grace tier for new users
 */
const activateGraceTier = async (userId) => {
  try {
    // Check if user already has a subscription
    const existing = await query(
      `SELECT id FROM subscriptions WHERE user_id = $1`,
      [userId]
    );

    if (existing.rows.length > 0) {
      logger.info('User already has subscription', { userId });
      return { success: false, reason: 'Already subscribed' };
    }

    // Create grace tier (complimentary)
    await query(
      `INSERT INTO subscriptions (user_id, status, tier, grace_period, created_at)
       VALUES ($1, 'active', $2, true, NOW())`,
      [userId, TIERS.GRACE]
    );

    logger.info('Grace tier activated', { userId });

    return { success: true, tier: TIERS.GRACE };
  } catch (error) {
    logger.error('Grace tier activation failed', { error: error.message });
    throw error;
  }
};

/**
 * Check if content is tier-locked
 */
const checkTierAccess = async (userId, requiredTier) => {
  try {
    const result = await query(
      `SELECT tier FROM subscriptions 
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    if (result.rows.length === 0) {
      return { hasAccess: false, reason: 'No active subscription' };
    }

    const userTier = result.rows[0].tier;
    const tierOrder = [TIERS.GRACE, TIERS.BASIC, TIERS.PREMIUM, TIERS.ENTERPRISE];
    
    const userTierIndex = tierOrder.indexOf(userTier);
    const requiredTierIndex = tierOrder.indexOf(requiredTier);

    const hasAccess = userTierIndex >= requiredTierIndex;

    return { hasAccess, userTier, requiredTier };
  } catch (error) {
    logger.error('Tier access check failed', { error: error.message });
    return { hasAccess: false, error: true };
  }
};

/**
 * Check if ID is expired and block subscription renewal
 */
const validateIDForRenewal = async (userId) => {
  try {
    const result = await query(
      `SELECT kd.id_expiry 
       FROM kyc_documents kd
       JOIN kyc_sessions ks ON kd.kyc_session_id = ks.id
       WHERE ks.user_id = $1 
       AND ks.status = 'approved'
       ORDER BY kd.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return { valid: false, reason: 'No KYC documents found' };
    }

    const idExpiry = new Date(result.rows[0].id_expiry);
    const now = new Date();

    if (idExpiry < now) {
      logger.warn('Expired ID blocking renewal', { userId, idExpiry });
      return { valid: false, reason: 'ID document expired' };
    }

    return { valid: true };
  } catch (error) {
    logger.error('ID validation failed', { error: error.message });
    return { valid: false, error: true };
  }
};

module.exports = {
  TIERS,
  activateGraceTier,
  checkTierAccess,
  validateIDForRenewal
};
