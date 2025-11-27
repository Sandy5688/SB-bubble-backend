const { query } = require('../config/database');
const { createLogger } = require('../config/monitoring');

const logger = createLogger('catalog-controller');

/**
 * Get catalog items
 */
const getItems = async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;
    
    let sql = 'SELECT * FROM items WHERE 1=1';
    const params = [];
    
    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    
    params.push(limit);
    sql += ` LIMIT $${params.length}`;
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Get items failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch items'
    });
  }
};

/**
 * Get single item
 */
const getItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM items WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Get item failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch item'
    });
  }
};

module.exports = {
  getItems,
  getItem
};
