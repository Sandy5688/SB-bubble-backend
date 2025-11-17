module.exports = {
  // User roles
  USER_ROLES: {
    ADMIN: 'admin',
    USER: 'user',
    GUEST: 'guest'
  },

  // Workflow statuses
  WORKFLOW_STATUS: {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },

  // Payment statuses
  PAYMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled'
  },

  // Message statuses
  MESSAGE_STATUS: {
    PENDING: 'pending',
    SENT: 'sent',
    DELIVERED: 'delivered',
    FAILED: 'failed',
    BOUNCED: 'bounced'
  },

  // File statuses
  FILE_STATUS: {
    PENDING: 'pending',
    UPLOADED: 'uploaded',
    PROCESSING: 'processing',
    READY: 'ready',
    FAILED: 'failed'
  },

  // Virus scan statuses
  VIRUS_SCAN_STATUS: {
    PENDING: 'pending',
    CLEAN: 'clean',
    INFECTED: 'infected',
    ERROR: 'error'
  },

  // AI models
  AI_MODELS: {
    GPT4: 'gpt-4-turbo-preview',
    GPT35: 'gpt-3.5-turbo'
  },

  // Error codes
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR'
  },

  // Max file size (10MB in bytes)
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  // Allowed file types
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ],

  // Retry configuration
  RETRY_CONFIG: {
    MAX_RETRIES: 3,
    BASE_DELAY: 1000
  }
};
