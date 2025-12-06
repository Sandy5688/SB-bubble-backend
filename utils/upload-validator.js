const crypto = require('crypto');
const { createLogger } = require('../config/monitoring');
const logger = createLogger('upload-validator');

// Magic bytes for file type validation
const MAGIC_BYTES = {
  'image/jpeg': [
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]),
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE1]),
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE2])
  ],
  'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
  'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])],
  'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])]
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate uploaded file
 */
function validateUpload(file, allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']) {
  if (!file) {
    throw new Error('No file provided');
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`File type ${file.mimetype} not allowed. Allowed: ${allowedTypes.join(', ')}`);
  }

  // Check magic bytes
  const buffer = file.buffer || file.data;
  if (buffer) {
    const magicBytes = MAGIC_BYTES[file.mimetype];
    if (magicBytes) {
      const matches = magicBytes.some(magic => 
        buffer.slice(0, magic.length).equals(magic)
      );
      
      if (!matches) {
        throw new Error('File content does not match declared type (magic byte mismatch)');
      }
    }
  }

  // Check for multi-extension attacks (file.jpg.exe)
  const filename = file.originalname || file.name;
  const parts = filename.split('.');
  if (parts.length > 2) {
    logger.warn('Suspicious multi-extension filename detected', { filename });
  }

  return true;
}

/**
 * Generate secure key for file storage
 */
function generateSecureKey(userId, fileType, originalName) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const ext = originalName.split('.').pop().toLowerCase();
  
  return `${userId}/${fileType}/${timestamp}-${random}.${ext}`;
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

module.exports = {
  validateUpload,
  generateSecureKey,
  sanitizeFilename,
  MAGIC_BYTES,
  MAX_FILE_SIZE
};
