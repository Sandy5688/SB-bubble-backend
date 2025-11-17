# API Documentation

## Overview

The Bubble Backend API provides a comprehensive REST API for integrating with Bubble.io applications. It includes authentication, file management, payments, messaging, AI capabilities, and workflow orchestration.

## Base URL

- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://api.yourdomain.com/api/v1`

## Authentication

All protected endpoints require two headers:

1. **API Key** (Internal): `x-api-key: your-internal-api-key`
2. **Bearer Token** (User): `Authorization: Bearer <access_token>`

### Getting Started

1. Sign up for an account: `POST /auth/signup`
2. Sign in to get access token: `POST /auth/signin`
3. Use access token in subsequent requests

## Interactive Documentation

- **Swagger UI**: `http://localhost:3000/api/v1/api-docs`
- **OpenAPI JSON**: `http://localhost:3000/api/v1/api-docs.json`
- **Postman Collection**: Import `docs/postman_collection.json`

## Endpoints Overview

### Authentication (`/auth`)

- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Sign in user
- `POST /auth/signout` - Sign out user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/reset-password` - Request password reset
- `GET /auth/me` - Get current user

### User Management (`/user`)

- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `GET /user/stats` - Get user statistics
- `DELETE /user/deactivate` - Deactivate account

### File Management (`/files`)

- `POST /files/upload-url` - Get presigned upload URL
- `POST /files/confirm` - Confirm file upload
- `GET /files` - List user files
- `GET /files/:fileId` - Get file details
- `GET /files/:fileId/download` - Get download URL
- `DELETE /files/:fileId` - Delete file

### Payments (`/pay`)

- `POST /pay/stripe/create` - Create Stripe payment
- `POST /pay/paypal/create` - Create PayPal payment
- `POST /pay/confirm` - Confirm payment
- `POST /pay/refund/:transactionId` - Refund payment
- `GET /pay/transaction/:transactionId` - Get transaction
- `POST /pay/webhook/stripe` - Stripe webhook handler

### Messaging (`/msg`)

- `POST /msg/email` - Send email
- `POST /msg/sms` - Send SMS
- `GET /msg/:messageId` - Get message status

### AI (`/ai`)

- `POST /ai/extract` - Extract data from text
- `POST /ai/structure` - Structure unstructured data
- `POST /ai/compare` - Compare datasets
- `POST /ai/decide` - Make AI-powered decision

### Workflows (`/flow`)

- `POST /flow/create` - Create workflow run
- `GET /flow` - List user workflows
- `GET /flow/:workflowId` - Get workflow details
- `POST /flow/:workflowId/cancel` - Cancel workflow
- `POST /flow/:workflowId/retry` - Retry workflow

### System (`/health`)

- `GET /health` - Health check endpoint

## Rate Limits

- **General**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Payments**: 10 requests per minute
- **AI**: 20 requests per minute

## Error Handling

All errors follow this format:
```json
{
  "status": "error",
  "message": "Error description here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Webhooks

### Stripe Webhooks

Endpoint: `POST /pay/webhook/stripe`

Stripe will send webhook events to this endpoint. The signature is automatically verified.

## Testing

Import the Postman collection and configure:

1. Set `base_url` variable
2. Set `api_key` variable
3. Sign in to get `access_token` (auto-saved)
4. Test all endpoints

## Support

For API support, contact: support@example.com
