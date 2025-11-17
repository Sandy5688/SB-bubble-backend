# Twilio Integration Guide

## 🎯 What Happens When Client Sends Twilio Credentials

### Step 1: Receive Credentials
Client will provide:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 2: Update Environment (2 minutes)
```bash
# Edit .env file
nano .env

# Add these lines:
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx  # From client
TWILIO_AUTH_TOKEN=your_auth_token    # From client
TWILIO_PHONE_NUMBER=+1234567890      # From client
```

### Step 3: Restart Server (1 minute)
```bash
# Stop current server (Ctrl+C)
# Restart
npm run dev
```

### Step 4: Test SMS Endpoint (2 minutes)
```bash
# Get a valid user token first (after they add Supabase credentials)
# Or test the endpoint structure:

curl -X POST http://localhost:3000/api/v1/msg/sms \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-bubble-api-key-12345" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -d '{
    "recipient": "+1234567890",
    "body": "Test SMS from Bubble Backend!"
  }'
```

### Step 5: Verify in Twilio Dashboard (1 minute)

1. Go to Twilio Console → Messaging → Logs
2. Check for sent message
3. Verify delivery status

### Expected Response (Success):
```json
{
  "success": true,
  "messageId": "SMxxxxx",
  "message": "SMS sent successfully"
}
```

### Common Issues:

**Issue 1: Invalid credentials**
```json
{"status": "error", "message": "Twilio authentication failed"}
```
**Solution:** Double-check Account SID and Auth Token

**Issue 2: Invalid phone number**
```json
{"status": "error", "message": "Invalid phone number format"}
```
**Solution:** Ensure number includes country code (+1 for US)

**Issue 3: Unverified recipient (Test mode)**
```json
{"status": "error", "message": "Phone number not verified"}
```
**Solution:** In Twilio test mode, add recipient to verified callers

## ✅ Integration Checklist

- [ ] Received all 3 Twilio credentials
- [ ] Added credentials to .env
- [ ] Restarted server
- [ ] Tested SMS endpoint
- [ ] Verified in Twilio dashboard
- [ ] Confirmed delivery
- [ ] Notified client: "Twilio integration complete!"

## 🎉 Success Message for Client
```
Hi! Twilio SMS integration is now live! ✅

✅ Credentials configured
✅ SMS endpoint tested
✅ Messages sending successfully

Your backend can now:
- Send transactional SMS
- Send OTP codes
- Send notifications
- Track delivery status

Test endpoint: POST /api/v1/msg/sms

All systems operational! ��
```
