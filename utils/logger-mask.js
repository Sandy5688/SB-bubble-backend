const SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'email',
  'phone',
  'phoneNumber',
  'ssn',
  'passport',
  'driverLicense',
  'nationalId',
  'creditCard',
  'cvv',
  'ip',
  'ipAddress',
  'user-agent',
  'userAgent'
];

/**
 * Mask sensitive data in objects
 */
const maskSensitiveData = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => maskSensitiveData(item));
  }

  const masked = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key is sensitive
    const isSensitive = SENSITIVE_FIELDS.some(field => 
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      if (typeof value === 'string') {
        // Mask but keep first/last chars for debugging
        if (value.length <= 4) {
          masked[key] = '***';
        } else if (lowerKey.includes('email')) {
          // email@domain.com -> e***l@d***n.com
          const [local, domain] = value.split('@');
          masked[key] = `${local[0]}***${local[local.length-1]}@${domain[0]}***${domain.split('.')[0].slice(-1)}.${domain.split('.')[1]}`;
        } else if (lowerKey.includes('phone')) {
          // +1234567890 -> +***7890
          masked[key] = value.slice(0, 2) + '***' + value.slice(-4);
        } else {
          masked[key] = value.slice(0, 2) + '***' + value.slice(-2);
        }
      } else {
        masked[key] = '***REDACTED***';
      }
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }

  return masked;
};

/**
 * Mask IP addresses (keep first 2 octets)
 */
const maskIP = (ip) => {
  if (!ip) return 'unknown';
  
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  
  // IPv6 - keep first segment
  if (ip.includes(':')) {
    return ip.split(':')[0] + ':***';
  }
  
  return 'xxx.xxx.xxx.xxx';
};

module.exports = {
  maskSensitiveData,
  maskIP,
  SENSITIVE_FIELDS
};
