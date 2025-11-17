# Bubble Backend API

Production-grade Node.js + Express backend for Bubble.io applications with Supabase, payments, messaging, file handling, and AI capabilities.

## �� Features

- ✅ **Authentication**: Supabase Auth with JWT tokens
- ✅ **Database**: PostgreSQL via Supabase with Row Level Security (RLS)
- ✅ **File Storage**: AWS S3 presigned URLs with virus scanning
- ✅ **Payments**: Stripe + PayPal integration with webhooks
- ✅ **Messaging**: Email (SendGrid) + SMS (Twilio)
- ✅ **AI Integration**: OpenAI GPT-4 for data extraction, structuring, comparison, and decisions
- ✅ **Background Workers**: BullMQ job processing
- ✅ **API Documentation**: Swagger/OpenAPI + Postman collection
- ✅ **Security**: Helmet, CORS, rate limiting, encryption
- ✅ **Monitoring**: Winston logging with auto-redaction
- ✅ **Testing**: 20+ automated tests with Jest
- ✅ **Deployment**: Docker, docker-compose, PM2 ready

## 📋 Prerequisites

- Node.js 20+
- Supabase account
- AWS S3 bucket (or compatible)
- Stripe account (test mode)
- PayPal sandbox account
- SendGrid API key
- OpenAI API key
- Redis (for workers)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd bubble-backend-api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Database Setup

1. Go to your Supabase project SQL Editor
2. Run `database/schema.sql`
3. Run `database/rls_policies.sql`
4. (Optional) Run `database/seed.sql`

### 5. Start Development Server
```bash
npm run dev
```

Server will run at: `http://localhost:3000`

### 6. Run Tests
```bash
npm test
```

## 📚 Documentation

- **Swagger UI**: http://localhost:3000/api/v1/api-docs
- **API Docs**: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- **Postman Collection**: [docs/postman_collection.json](docs/postman_collection.json)

## 🏗️ Project Structure
```
bubble-backend-api/
├── config/              # Configuration files
│   ├── database.js      # Supabase client
│   ├── env.js           # Environment validation
│   ├── swagger.js       # API documentation
│   └── constants.js     # App constants
├── controllers/         # Route controllers
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── file.controller.js
│   ├── payment.controller.js
│   ├── messaging.controller.js
│   ├── ai.controller.js
│   └── workflow.controller.js
├── database/           # Database schemas & migrations
│   ├── schema.sql      # Main database schema
│   ├── rls_policies.sql # Row Level Security policies
│   ├── seed.sql        # Seed data
│   └── migrate.js      # Migration runner
├── docs/               # API documentation
│   ├── API_DOCUMENTATION.md
│   └── postman_collection.json
├── middleware/         # Express middleware
│   ├── errorHandler.js
│   ├── security.js
│   └── requestLogger.js
├── routes/            # API routes
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── file.routes.js
│   ├── payment.routes.js
│   ├── messaging.routes.js
│   ├── ai.routes.js
│   ├── workflow.routes.js
│   ├── health.routes.js
│   └── index.js
├── services/          # Business logic
│   ├── auth.service.js
│   ├── user.service.js
│   ├── file.service.js
│   ├── payment.service.js
│   ├── messaging.service.js
│   ├── ai.service.js
│   └── workflow.service.js
├── tests/             # Automated tests
│   ├── unit/
│   ├── integration/
│   └── setup.js
├── utils/             # Helper functions
│   ├── logger.js
│   ├── encryption.js
│   └── helpers.js
├── workers/           # Background job processors
│   ├── jobs/
│   ├── private/       # (gitignored - sensitive logic)
│   ├── queue.js
│   └── index.js
├── scripts/           # Deployment scripts
│   ├── deploy.sh
│   ├── start.sh
│   ├── stop.sh
│   └── health-check.sh
├── .env.example       # Environment template
├── .gitignore
├── app.js             # Express app setup
├── server.js          # Server entry point
├── package.json
├── Dockerfile
├── docker-compose.yml
├── pm2.config.js
└── README.md
```

## 🔐 Environment Variables

See `.env.example` for all required environment variables.

**Critical Variables:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `S3_BUCKET_NAME` - S3 bucket name
- `STRIPE_SECRET_KEY` - Stripe secret key
- `OPENAI_API_KEY` - OpenAI API key
- `INTERNAL_API_KEY` - Internal API key for Bubble

## 🐳 Deployment

### Docker Deployment
```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### PM2 Deployment
```bash
# Start with PM2
pm2 start pm2.config.js --env production

# Monitor
pm2 monit

# View logs
pm2 logs

# Stop
pm2 stop all
```

### Manual Deployment
```bash
# Install dependencies
npm ci --only=production

# Start server
NODE_ENV=production npm start
```

## 🧪 Testing
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Register user
- `POST /api/v1/auth/signin` - Sign in user
- `POST /api/v1/auth/signout` - Sign out user
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### User Management
- `GET /api/v1/user/profile` - Get profile
- `PUT /api/v1/user/profile` - Update profile
- `GET /api/v1/user/stats` - Get statistics

### Files
- `POST /api/v1/files/upload-url` - Get upload URL
- `POST /api/v1/files/confirm` - Confirm upload
- `GET /api/v1/files` - List files
- `GET /api/v1/files/:id` - Get file
- `DELETE /api/v1/files/:id` - Delete file

### Payments
- `POST /api/v1/pay/stripe/create` - Create Stripe payment
- `POST /api/v1/pay/paypal/create` - Create PayPal payment
- `POST /api/v1/pay/confirm` - Confirm payment
- `POST /api/v1/pay/refund/:id` - Refund payment

### Messaging
- `POST /api/v1/msg/email` - Send email
- `POST /api/v1/msg/sms` - Send SMS

### AI
- `POST /api/v1/ai/extract` - Extract data
- `POST /api/v1/ai/structure` - Structure data
- `POST /api/v1/ai/compare` - Compare data
- `POST /api/v1/ai/decide` - AI decision

### Workflows
- `POST /api/v1/flow/create` - Create workflow
- `GET /api/v1/flow` - List workflows
- `GET /api/v1/flow/:id` - Get workflow

### System
- `GET /api/v1/health` - Health check

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Whitelisted origins only
- **Rate Limiting**: Per-route limits
- **JWT Authentication**: Secure token-based auth
- **API Key Validation**: Internal API key required
- **Encryption**: AES-256-GCM for sensitive data
- **PII Redaction**: Automatic in logs
- **Input Sanitization**: XSS prevention
- **Webhook Signature Verification**: Stripe/PayPal

## 📝 Logging

Logs are stored in `logs/` directory:
- `application-YYYY-MM-DD.log` - All logs
- `error-YYYY-MM-DD.log` - Error logs only

Logs automatically rotate daily and are retained for 14-30 days.

## 🔄 Background Workers

Workers handle:
- Workflow execution
- File processing & virus scanning
- Email/SMS delivery with retries
- AI processing jobs
- Scheduled cleanup tasks

Start workers:
```bash
node workers/index.js
# or with PM2
pm2 start pm2.config.js
```

## 🛠️ Maintenance

### Database Backups
Regular backups via Supabase Dashboard or:
```bash
pg_dump -h YOUR_HOST -U postgres -d postgres > backup.sql
```

### Log Cleanup
```bash
./scripts/cleanup-logs.sh 30  # Delete logs older than 30 days
```

### Health Monitoring
```bash
./scripts/health-check.sh
```

## 🐛 Troubleshooting

### Server won't start
- Check `.env` file exists and is valid
- Verify all required environment variables are set
- Check port 3000 is not in use

### Database connection fails
- Verify Supabase credentials
- Check network connectivity
- Ensure RLS policies are applied

### Tests failing
- Run `npm install` to ensure all dependencies
- Check test environment variables in `tests/setup.js`
- Verify Redis is running (for worker tests)

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Email: support@example.com

## 📄 License

MIT

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🎉 Acknowledgments

Built with:
- Node.js & Express
- Supabase
- Stripe & PayPal
- OpenAI
- AWS S3
- SendGrid & Twilio
- BullMQ & Redis
