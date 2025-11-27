# 🚀 Bubble Backend API Documentation

**Base URL:** `https://bubble-backend-api-production.up.railway.app/api/v1`

---

## 🔐 Authentication

### Register User
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "emailVerified": false
    },
    "tokens": {
      "accessToken": "jwt...",
      "refreshToken": "token..."
    }
  }
}
```

---

### Login
```http
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** Same as Register

---

### Get Current User
```http
GET /auth/me
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "emailVerified": false,
    "profilePicture": null,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "lastLoginAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

---

### Logout
```http
POST /auth/logout
Authorization: Bearer <accessToken>
```

---

### Google OAuth
```http
GET /auth/google/start
POST /auth/google/callback
```

### Apple OAuth
```http
GET /auth/apple/start
POST /auth/apple/callback
```

---

## 📄 KYC Verification

### Start KYC Session
```http
POST /kyc/start
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "kycSessionId": "uuid",
    "status": "pending_consent",
    "next": "consent"
  }
}
```

---

### Submit Consent
```http
POST /kyc/consent
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "kycSessionId": "uuid",
  "consentVersion": "1.0"
}
```

---

### Get ID Options
```http
GET /kyc/options
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "idTypes": [
      {"value": "passport", "label": "Passport"},
      {"value": "driver_license", "label": "Driver License"},
      {"value": "national_id", "label": "National ID"}
    ]
  }
}
```

---

### Get Upload URL (for document upload)
```http
POST /kyc/upload-url
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "kycSessionId": "uuid",
  "fileName": "passport.jpg",
  "fileType": "image/jpeg",
  "idType": "passport"
}
```

**Note:** Requires AWS S3 configuration

---

### Send OTP
```http
POST /kyc/send-otp
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "kycSessionId": "uuid",
  "method": "email",
  "destination": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "OTP sent via email",
    "otpId": "uuid",
    "expiresAt": "2025-01-01T00:10:00.000Z",
    "method": "email",
    "destination": "use***@example.com"
  }
}
```

---

### Verify OTP
```http
POST /kyc/verify-otp
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "kycSessionId": "uuid",
  "otp": "123456"
}
```

---

### Check KYC Status
```http
GET /kyc/status/:kycSessionId
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "kycSessionId": "uuid",
    "status": "pending_upload",
    "otp_verified": false,
    "selected_id_type": null,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### Change ID Type
```http
POST /kyc/change-id-type
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "kycSessionId": "uuid",
  "idType": "driver_license"
}
```

---

## 💳 Payments

### Create Stripe Customer
```http
POST /payment/create-customer
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Note:** Requires completed KYC verification

---

### Add Payment Method
```http
POST /payment/add-payment-method
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "paymentMethodId": "pm_..."
}
```

---

### Create Subscription
```http
POST /payment/create-subscription
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "priceId": "price_..."
}
```

---

### Cancel Subscription
```http
POST /payment/cancel-subscription/:subscriptionId
Authorization: Bearer <accessToken>
```

---

### Get Subscription
```http
GET /payment/subscription/:subscriptionId
Authorization: Bearer <accessToken>
```

---

### Activate Grace Tier
```http
POST /payment/grace-activate
Authorization: Bearer <accessToken>
```

---

## �� Account Management

### Request Account Deletion (30-day grace period)
```http
POST /account/delete/request
Authorization: Bearer <accessToken>
```

---

### Cancel Deletion
```http
POST /account/delete/cancel
Authorization: Bearer <accessToken>
```

---

### Immediate Deletion
```http
DELETE /account/delete/immediate
Authorization: Bearer <accessToken>
```

---

### Check Deletion Status
```http
GET /account/delete/status
Authorization: Bearer <accessToken>
```

---

## ✨ Magic Link Authentication

### Send Magic Link
```http
POST /magic/send
Content-Type: application/json

{
  "email": "user@example.com"
}
```

---

### Verify Magic Link
```http
POST /magic/verify
Content-Type: application/json

{
  "token": "magic-link-token"
}
```

---

## 🔒 CSRF Token

### Get CSRF Token
```http
GET /auth/csrf-token
```

**Response:**
```json
{
  "csrfToken": "token...",
  "message": "CSRF token generated successfully"
}
```

---

## 🏥 Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 1234.56,
  "environment": "production",
  "version": "1.0.0",
  "database": "healthy"
}
```

---

## ⚠️ Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## 🔑 Authentication Notes

1. **Access Token:** Valid for 15 minutes
2. **Refresh Token:** Valid for 7 days
3. **Token Rotation:** New refresh token issued on each refresh
4. Include `Authorization: Bearer <token>` header for protected routes

---

## 📱 KYC Flow

1. `POST /kyc/start` → Get session ID
2. `POST /kyc/consent` → Accept terms
3. `GET /kyc/options` → Get ID types
4. `POST /kyc/upload-url` → Get S3 upload URL
5. Upload document to S3
6. `POST /kyc/confirm-upload` → Confirm upload
7. `POST /kyc/send-otp` → Request verification code
8. `POST /kyc/verify-otp` → Submit code
9. `GET /kyc/status/:id` → Check status

---

## 🌐 Base URLs

- **Production:** `https://bubble-backend-api-production.up.railway.app/api/v1`
- **Health Check:** `https://bubble-backend-api-production.up.railway.app/api/v1/health`

---

**Last Updated:** November 27, 2025
