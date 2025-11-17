const { cleanEnv, str, port, url, email, bool, num } = require('envalid');

const env = cleanEnv(process.env, {
  // Server
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: port({ default: 3000 }),
  API_VERSION: str({ default: 'v1' }),

  // Supabase
  SUPABASE_URL: url(),
  SUPABASE_ANON_KEY: str(),
  SUPABASE_SERVICE_ROLE_KEY: str(),

  // AWS S3
  AWS_REGION: str({ default: 'us-east-1' }),
  AWS_ACCESS_KEY_ID: str(),
  AWS_SECRET_ACCESS_KEY: str(),
  S3_BUCKET_NAME: str(),

  // Stripe
  STRIPE_SECRET_KEY: str(),
  STRIPE_PUBLISHABLE_KEY: str(),
  STRIPE_WEBHOOK_SECRET: str(),

  // PayPal
  PAYPAL_MODE: str({ choices: ['sandbox', 'live'], default: 'sandbox' }),
  PAYPAL_CLIENT_ID: str(),
  PAYPAL_CLIENT_SECRET: str(),

  // SendGrid
  SENDGRID_API_KEY: str(),
  SENDGRID_FROM_EMAIL: email(),
  SENDGRID_FROM_NAME: str({ default: 'Bubble App' }),

  // Twilio (Optional)
  TWILIO_ACCOUNT_SID: str({ default: '' }),
  TWILIO_AUTH_TOKEN: str({ default: '' }),
  TWILIO_PHONE_NUMBER: str({ default: '' }),

  // OpenAI
  OPENAI_API_KEY: str(),
  OPENAI_MODEL: str({ default: 'gpt-4-turbo-preview' }),

  // Redis
  REDIS_HOST: str({ default: 'localhost' }),
  REDIS_PORT: port({ default: 6379 }),
  REDIS_PASSWORD: str({ default: '' }),

  // Security
  JWT_SECRET: str(),
  ENCRYPTION_KEY: str(),
  INTERNAL_API_KEY: str(),

  // CORS
  ALLOWED_ORIGINS: str({ default: 'http://localhost:3000' }),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: num({ default: 900000 }),
  RATE_LIMIT_MAX_REQUESTS: num({ default: 100 }),

  // Monitoring
  SENTRY_DSN: str({ default: '' }),
  LOGTAIL_SOURCE_TOKEN: str({ default: '' }),

  // Workers
  ENABLE_WORKERS: bool({ default: true }),
  WORKER_CONCURRENCY: num({ default: 5 }),

  // File Upload
  MAX_FILE_SIZE_MB: num({ default: 10 }),
  ALLOWED_FILE_TYPES: str({ default: 'pdf,doc,docx,jpg,png,jpeg' }),

  // Virus Scan
  CLAMAV_HOST: str({ default: 'localhost' }),
  CLAMAV_PORT: port({ default: 3310 })
});

module.exports = env;
