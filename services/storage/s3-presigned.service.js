const s3Service = require('./s3.service');
const { createLogger } = require('../../config/monitoring');
const logger = createLogger('s3-presigned');

/**
 * S3 Presigned URL Service
 * Wrapper around main S3 service for presigned URLs
 */

/**
 * Generate presigned URL for file upload
 */
async function generateUploadUrl(key, expiresIn = 3600) {
  try {
    return await s3Service.getPresignedUrl(key, expiresIn, 'putObject');
  } catch (error) {
    logger.error('Failed to generate upload URL', { error: error.message, key });
    throw error;
  }
}

/**
 * Generate presigned URL for file download
 */
async function generateDownloadUrl(key, expiresIn = 3600) {
  try {
    return await s3Service.getPresignedUrl(key, expiresIn, 'getObject');
  } catch (error) {
    logger.error('Failed to generate download URL', { error: error.message, key });
    throw error;
  }
}

module.exports = {
  generateUploadUrl,
  generateDownloadUrl,
  getPresignedUrl: s3Service.getPresignedUrl // Alias
};
