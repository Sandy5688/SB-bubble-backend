const clamavService = require('../security/clamav.service');
const { createLogger } = require('../../config/monitoring');
const logger = createLogger('virus-scanner');

/**
 * Scan file for viruses
 * Uses ClamAV if available, falls back to pattern matching
 */
async function scanFile(buffer) {
  try {
    logger.info('Scanning file for viruses', { size: buffer.length });

    // Try ClamAV first
    const result = await clamavService.scanBuffer(buffer);
    
    if (!result.safe) {
      logger.warn('File infected', { viruses: result.viruses, scanner: result.scanner });
    } else {
      logger.info('File clean', { scanner: result.scanner });
    }

    return result;

  } catch (error) {
    logger.error('Virus scan failed', { error: error.message });
    return {
      safe: false,
      error: error.message,
      scanner: 'error'
    };
  }
}

module.exports = {
  scanFile
};
