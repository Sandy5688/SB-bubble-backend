const s3Service = require('./storage/s3.service');
const virusScanner = require('./storage/virus-scanner.service');
const { createLogger } = require('../config/monitoring');
const logger = createLogger('file-service');

/**
 * File Service - Handles file operations
 */

async function uploadFile(file, userId, category = 'general') {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Scan for viruses
    const scanResult = await virusScanner.scanFile(file.buffer || file.data);
    if (!scanResult.safe) {
      throw new Error('File failed security scan');
    }

    // Generate S3 key
    const key = `${userId}/${category}/${Date.now()}-${file.originalname || file.name}`;

    // Upload to S3
    const result = await s3Service.uploadFile(
      key,
      file.buffer || file.data,
      file.mimetype
    );

    logger.info('File uploaded successfully', { userId, key, size: file.size });

    return {
      key,
      url: result.url,
      size: file.size,
      mimetype: file.mimetype
    };

  } catch (error) {
    logger.error('File upload failed', { error: error.message, userId });
    throw error;
  }
}

async function deleteFile(key) {
  try {
    await s3Service.deleteFile(key);
    logger.info('File deleted', { key });
    return { success: true };
  } catch (error) {
    logger.error('File deletion failed', { error: error.message, key });
    throw error;
  }
}

async function getFileUrl(key, expiresIn = 3600) {
  try {
    const url = await s3Service.getPresignedUrl(key, expiresIn);
    return url;
  } catch (error) {
    logger.error('Failed to get file URL', { error: error.message, key });
    throw error;
  }
}

module.exports = {
  uploadFile,
  deleteFile,
  getFileUrl
};
