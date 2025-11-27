const regionService = require('../services/region.service');

/**
 * Example Catalog Controller
 * Demonstrates region-based filtering
 */

/**
 * Get catalog items (region-filtered)
 */
exports.getItems = async (req, res) => {
  try {
    const { countryCode, regionCode } = req.context;

    // Method 1: Using Supabase with region filter
    const supportedFeatures = await regionService.getSupportedFeatures(
      countryCode, 
      regionCode
    );

      .from('items')
      .select('*');

    if (supportedFeatures.length > 0) {
      query = query.in('internal_feature_id', supportedFeatures);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      status: 'success',
      data: {
        items: data,
        region: {
          country: countryCode,
          region: regionCode,
          filteredCount: data.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get single item (check region availability)
 */
exports.getItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { countryCode, regionCode } = req.context;

    // Get item
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Item not found'
      });
    }

    // Check if available in region
    const isAvailable = await regionService.isFeatureAvailable(
      item.internal_feature_id,
      countryCode,
      regionCode
    );

    if (!isAvailable) {
      return res.status(403).json({
        status: 'error',
        message: 'This item is not available in your region',
        region: {
          country: countryCode,
          region: regionCode
        }
      });
    }

    res.json({
      status: 'success',
      data: item
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = exports;
