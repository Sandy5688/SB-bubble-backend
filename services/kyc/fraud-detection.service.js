const { query } = require('../../config/database');
const { createLogger } = require('../../config/monitoring');

const logger = createLogger('fraud-detection');

/**
 * Check for duplicate ID documents
 */
const checkDuplicateID = async (documentNumber, docType, userId) => {
  try {
    const result = await query(
      `SELECT kd.user_id, u.email 
       FROM kyc_documents kd
       JOIN kyc_sessions ks ON kd.kyc_session_id = ks.id
       JOIN users u ON ks.user_id = u.id
       WHERE kd.ocr_extracted->>'documentNumber' = $1
       AND kd.doc_type = $2
       AND ks.user_id != $3
       AND ks.status = 'approved'
       LIMIT 1`,
      [documentNumber, docType, userId]
    );

    if (result.rows.length > 0) {
      logger.warn('Duplicate ID detected', { 
        documentNumber: documentNumber.slice(0, 4) + '***',
        docType,
        userId,
        existingUser: result.rows[0].user_id
      });

      return {
        isDuplicate: true,
        existingUserId: result.rows[0].user_id,
        reason: 'Document already used by another account'
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    logger.error('Duplicate ID check failed', { error: error.message });
    return { isDuplicate: false, error: true };
  }
};

/**
 * Check for multiple accounts from same user
 */
const checkMultipleAccounts = async (email, phoneNumber, userId) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM users
       WHERE (email = $1 OR phone = $2)
       AND id != $3
       AND deleted_at IS NULL`,
      [email, phoneNumber, userId]
    );

    const count = parseInt(result.rows[0].count);

    if (count > 0) {
      logger.warn('Multiple accounts detected', { email, phoneNumber, userId });
      return {
        hasMultiple: true,
        count,
        reason: 'User has multiple accounts'
      };
    }

    return { hasMultiple: false };
  } catch (error) {
    logger.error('Multiple accounts check failed', { error: error.message });
    return { hasMultiple: false, error: true };
  }
};

/**
 * Check for region mismatch
 */
const checkRegionMismatch = async (kycSessionId, documentCountry, userIP) => {
  try {
    // Get user's detected region
    const sessionResult = await query(
      `SELECT u.region_code, u.country_code
       FROM kyc_sessions ks
       JOIN users u ON ks.user_id = u.id
       WHERE ks.id = $1`,
      [kycSessionId]
    );

    if (sessionResult.rows.length === 0) {
      return { mismatch: false };
    }

    const userCountry = sessionResult.rows[0].country_code;

    // Check if document country matches user's country
    if (documentCountry && userCountry && documentCountry !== userCountry) {
      logger.warn('Region mismatch detected', {
        kycSessionId,
        documentCountry,
        userCountry
      });

      return {
        mismatch: true,
        documentCountry,
        userCountry,
        reason: 'ID country does not match user location'
      };
    }

    return { mismatch: false };
  } catch (error) {
    logger.error('Region mismatch check failed', { error: error.message });
    return { mismatch: false, error: true };
  }
};

/**
 * Check for expired ID
 */
const checkExpiredID = async (expiryDate) => {
  if (!expiryDate) {
    return { expired: false };
  }

  const expiry = new Date(expiryDate);
  const now = new Date();

  if (expiry < now) {
    logger.warn('Expired ID detected', { expiryDate });
    return {
      expired: true,
      reason: 'ID document has expired'
    };
  }

  // Check if expiring within 30 days
  const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry <= 30) {
    return {
      expired: false,
      expiringSoon: true,
      daysUntilExpiry
    };
  }

  return { expired: false };
};

/**
 * Run all fraud checks
 */
const runFraudChecks = async (kycSessionId, userId, ocrData, userEmail, userPhone, userIP) => {
  const checks = await Promise.all([
    checkDuplicateID(ocrData.documentNumber, ocrData.documentType, userId),
    checkMultipleAccounts(userEmail, userPhone, userId),
    checkRegionMismatch(kycSessionId, ocrData.nationality, userIP),
    checkExpiredID(ocrData.expiryDate)
  ]);

  const [duplicate, multiple, region, expired] = checks;

  const fraudFlags = [];

  if (duplicate.isDuplicate) fraudFlags.push('DUPLICATE_ID');
  if (multiple.hasMultiple) fraudFlags.push('MULTIPLE_ACCOUNTS');
  if (region.mismatch) fraudFlags.push('REGION_MISMATCH');
  if (expired.expired) fraudFlags.push('EXPIRED_ID');

  const isFraud = fraudFlags.length > 0;

  if (isFraud) {
    // Log to audit
    await query(
      `INSERT INTO kyc_audit_logs (kyc_session_id, user_id, action, details, timestamp)
       VALUES ($1, $2, 'fraud_check_failed', $3, NOW())`,
      [kycSessionId, userId, JSON.stringify({ fraudFlags, checks })]
    );

    logger.warn('Fraud detected', { kycSessionId, userId, fraudFlags });
  }

  return {
    isFraud,
    fraudFlags,
    details: { duplicate, multiple, region, expired }
  };
};

module.exports = {
  checkDuplicateID,
  checkMultipleAccounts,
  checkRegionMismatch,
  checkExpiredID,
  runFraudChecks
};
