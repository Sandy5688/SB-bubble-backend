const { query } = require('../config/database');
const { createLogger } = require('../config/monitoring');

const logger = createLogger('region-service');

/**
 * Get tenant regions
 */
const getTenantRegions = async (tenantId) => {
  try {
    const result = await query(
      'SELECT * FROM tenant_regions WHERE tenant_id = $1',
      [tenantId]
    );
    
    return result.rows;
  } catch (error) {
    logger.error('Get tenant regions failed', { error: error.message });
    throw error;
  }
};

/**
 * Detect user region from IP
 */
const detectRegion = (ipAddress) => {
  // Simple region detection based on IP
  // In production, use a proper IP geolocation service
  
  // Default to US
  return {
    country: 'US',
    region: 'North America',
    timezone: 'America/New_York'
  };
};

module.exports = {
  getTenantRegions,
  detectRegion
};
