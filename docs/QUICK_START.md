# ⚡ Quick Start Guide

Get started with Bubble Backend in 5 minutes.

---

## 1️⃣ Test the API (30 seconds)
```bash
# Health check
curl https://bubble-backend-api-production.up.railway.app/api/v1/health

# Expected: {"status":"healthy",...}
```

---

## 2️⃣ Register & Login (2 minutes)
```bash
# Register
curl -X POST https://bubble-backend-api-production.up.railway.app/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpass123","firstName":"Your","lastName":"Name"}'

# Login
curl -X POST https://bubble-backend-api-production.up.railway.app/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpass123"}'

# Copy the accessToken from response
```

---

## 3️⃣ Use Postman (2 minutes)

1. Open Postman
2. Import `POSTMAN_COLLECTION.json`
3. Run "1. Register User" (saves token automatically)
4. Run any other endpoint

---

## 4️⃣ Read API Docs (5 minutes)

Open `API_DOCUMENTATION.md` - All 63+ endpoints documented.

---

## 5️⃣ Configure for Production (15 minutes)

See `CLIENT_HANDOFF.md` for:
- AWS S3 setup
- Stripe production keys
- Frontend URL

---

**That's it! You're ready to integrate.**
