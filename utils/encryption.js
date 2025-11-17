const crypto = require('crypto');
const env = require('../config/env');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

// Derive key from password
const getKey = (salt) => {
  return crypto.pbkdf2Sync(env.ENCRYPTION_KEY, salt, 100000, 32, 'sha512');
};

// Encrypt data
const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getKey(salt);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
};

// Decrypt data
const decrypt = (encryptedText) => {
  const buffer = Buffer.from(encryptedText, 'base64');
  
  const salt = buffer.slice(0, SALT_LENGTH);
  const iv = buffer.slice(SALT_LENGTH, TAG_POSITION);
  const tag = buffer.slice(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = buffer.slice(ENCRYPTED_POSITION);
  
  const key = getKey(salt);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  return decipher.update(encrypted) + decipher.final('utf8');
};

// Hash data (one-way)
const hash = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

module.exports = {
  encrypt,
  decrypt,
  hash
};
