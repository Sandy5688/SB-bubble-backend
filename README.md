# Bubble Backend API

Production-ready backend API with authentication, KYC verification, and payment processing.

**Live API:** https://bubble-backend-api-production.up.railway.app/api/v1

## Quick Start
```bash
# Health check
curl https://bubble-backend-api-production.up.railway.app/api/v1/health

# Register user
curl -X POST https://bubble-backend-api-production.up.railway.app/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","firstName":"Test","lastName":"User"}'
```

## Documentation

- [API Documentation](docs/API_DOCUMENTATION.md) - Complete API reference
- [Quick Start](docs/QUICK_START.md) - Get started in 5 minutes
- [Client Handoff](docs/CLIENT_HANDOFF.md) - Configuration guide
- [Postman Collection](docs/POSTMAN_COLLECTION.json) - Import for testing

## Features

- Authentication (Email, Google OAuth, Apple OAuth, Magic Link)
- KYC Verification (Document upload, OTP verification)
- Payment Integration (Stripe subscriptions)
- Admin Panel (User & KYC management)
- Security (JWT, CSRF, HMAC, Rate Limiting)

**Total: 63+ Production Endpoints**

## Structure
```
bubble-backend-api/
├── controllers/     # Business logic
├── services/        # External integrations
├── routes/          # API routes
├── middleware/      # Security & validation
├── migrations/      # Database schema
├── config/          # Configuration
└── docs/            # Documentation
```

## Deployment

**Platform:** Railway  
**Auto-Deploy:** Enabled
```bash
railway logs      # View logs
railway up        # Deploy
railway rollback  # Rollback
```

## Configuration

See [CLIENT_HANDOFF.md](docs/CLIENT_HANDOFF.md) for environment setup.

Required:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Token signing
- `STRIPE_SECRET_KEY` - Payments
- `AWS_ACCESS_KEY_ID` - Document uploads

Optional:
- `SENDGRID_API_KEY` - Emails
- `TWILIO_ACCOUNT_SID` - SMS
- `GOOGLE_CLIENT_ID` - OAuth
