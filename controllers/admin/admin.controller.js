const { query } = require('../../config/database');
const { createLogger } = require('../../config/monitoring');

const logger = createLogger('admin-controller');

const listUsers = async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    
    let queryText = `
      SELECT id, email, full_name, email_verified, created_at, last_login_at, login_count
      FROM users
      WHERE deleted_at IS NULL
    `;
    const params = [];
    
    if (search) {
      queryText += ` AND (email ILIKE $1 OR full_name ILIKE $1)`;
      params.push(`%${search}%`);
    }
    
    queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await query(queryText, params);
    const countResult = await query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL');
    
    res.json({
      success: true,
      data: {
        users: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('List users failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

const getKYCStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await query(
      `SELECT ks.*, u.email, u.full_name
       FROM kyc_sessions ks
       JOIN users u ON ks.user_id = u.id
       WHERE ks.user_id = $1
       ORDER BY ks.created_at DESC
       LIMIT 1`,
      [userId]
    );
    
    res.json({
      success: true,
      data: result.rows.length > 0 ? { hasKYC: true, kyc: result.rows[0] } : { hasKYC: false }
    });
  } catch (error) {
    logger.error('Get KYC status failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateKYCStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status, notes } = req.body;
    
    const validStatuses = ['pending_consent', 'pending_upload', 'pending_verification', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    
    await query(
      `UPDATE kyc_sessions SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, sessionId]
    );
    
    await query(
      `INSERT INTO kyc_audit_logs (kyc_session_id, action, details, timestamp)
       VALUES ($1, $2, $3, NOW())`,
      [sessionId, `admin_status_change_${status}`, JSON.stringify({ notes, admin: req.adminEmail })]
    );
    
    logger.info('KYC status updated by admin', { sessionId, status });
    res.json({ success: true, message: 'KYC status updated' });
  } catch (error) {
    logger.error('Update KYC status failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

const listPaymentCustomers = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await query(
      `SELECT pc.*, u.email, u.full_name
       FROM payment_customers pc
       JOIN users u ON pc.user_id = u.id
       ORDER BY pc.created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );
    
    res.json({
      success: true,
      data: {
        customers: result.rows,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('List payment customers failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

const listSubscriptions = async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    
    let queryText = `
      SELECT s.*, u.email, u.full_name
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
    `;
    const params = [];
    
    if (status) {
      queryText += ` WHERE s.status = $1`;
      params.push(status);
    }
    
    queryText += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await query(queryText, params);
    
    res.json({
      success: true,
      data: {
        subscriptions: result.rows,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('List subscriptions failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  listUsers,
  getKYCStatus,
  updateKYCStatus,
  listPaymentCustomers,
  listSubscriptions
};
