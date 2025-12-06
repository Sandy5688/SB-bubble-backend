const NodeClam = require('clamscan');
const { createLogger } = require('../../config/monitoring');
const logger = createLogger('clamav');

let clamavScanner = null;

/**
 * Initialize ClamAV scanner
 */
async function initClamAV() {
  try {
    clamavScanner = await new NodeClam().init({
      removeInfected: false,
      quarantineInfected: false,
      scanLog: null,
      debugMode: false,
      clamdscan: {
        host: process.env.CLAMAV_HOST || 'localhost',
        port: process.env.CLAMAV_PORT || 3310,
        timeout: 60000
      }
    });

    logger.info('ClamAV initialized successfully');
    return true;

  } catch (error) {
    logger.warn('ClamAV not available, using fallback scanner', { error: error.message });
    return false;
  }
}

/**
 * Scan file buffer for viruses
 */
async function scanBuffer(buffer) {
  try {
    if (!clamavScanner) {
      await initClamAV();
    }

    if (clamavScanner) {
      const { isInfected, viruses } = await clamavScanner.scanStream(buffer);
      
      if (isInfected) {
        logger.warn('Virus detected', { viruses });
        return {
          safe: false,
          infected: true,
          viruses,
          scanner: 'clamav'
        };
      }

      logger.info('File clean (ClamAV)');
      return {
        safe: true,
        infected: false,
        scanner: 'clamav'
      };
    }

    // Fallback to pattern-based scanning
    return await fallbackScan(buffer);

  } catch (error) {
    logger.error('ClamAV scan failed', { error: error.message });
    return await fallbackScan(buffer);
  }
}

/**
 * Fallback pattern-based virus detection
 */
async function fallbackScan(buffer) {
  const maliciousPatterns = [
    Buffer.from('<?php'),
    Buffer.from('<script'),
    Buffer.from('eval('),
    Buffer.from('exec('),
    Buffer.from('\x4D\x5A'), // Windows executable
  ];

  for (const pattern of maliciousPatterns) {
    if (buffer.includes(pattern)) {
      logger.warn('Suspicious pattern detected (fallback scanner)');
      return {
        safe: false,
        infected: true,
        viruses: ['suspicious-pattern'],
        scanner: 'fallback'
      };
    }
  }

  return {
    safe: true,
    infected: false,
    scanner: 'fallback'
  };
}

/**
 * Check if ClamAV is available
 */
function isAvailable() {
  return !!clamavScanner;
}

module.exports = {
  scanBuffer,
  isAvailable,
  initClamAV
};
