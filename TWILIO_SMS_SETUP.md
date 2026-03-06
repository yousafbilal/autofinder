# 📱 TWILIO SMS SETUP - For Password Reset OTP

## ⚡ Quick Setup (5 minutes)

### Step 1: Sign Up for Twilio (2 min)
1. Go to: **https://www.twilio.com/**
2. Click **"Sign up free"** or **"Get Started"**
3. Enter your details and verify email
4. Verify phone number (for trial account)

### Step 2: Get Account Credentials (1 min)
1. After login, go to: **https://www.twilio.com/console**
2. You'll see:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click to reveal)
3. Copy both

### Step 3: Create Verify Service (1 min)
1. Go to: **https://www.twilio.com/console/verify/services**
2. Click **"Create new Verify Service"**
3. Friendly Name: `AutoFinder OTP`
4. Click **"Create"**
5. Copy **Service SID** (starts with `VA...`)

### Step 4: Update node.env File (30 sec)
Open `node.env` file and add:
```env
TWILIO_ACCOUNT_SID=ACyour-actual-account-sid-here
TWILIO_AUTH_TOKEN=your-actual-auth-token-here
TWILIO_VERIFY_SERVICE_SID=VAyour-actual-service-sid-here
```

### Step 5: Install Twilio Package (30 sec)
```bash
cd autofinder-backend-orignal-
npm install twilio
```

### Step 6: Restart Server (10 sec)
```bash
# Stop server (Ctrl+C)
# Then start again
npm start
# OR
node index.js
```

### Step 7: Test (30 sec)
1. Open app
2. Go to Forgot Password
3. Enter phone number (e.g., 03001234567)
4. Click "Send OTP"
5. Check SMS! ✅

---

## ✅ That's It! SMS Will Work Now

**Free Trial:**
- ✅ $15.50 free credit
- ✅ Test phone numbers available
- ✅ No credit card needed for trial
- ✅ Professional SMS delivery

---

## 📱 Phone Number Format

The code automatically formats:
- `03001234567` → `+923001234567`
- `923001234567` → `+923001234567`
- `+923001234567` → `+923001234567`

**Important:** Phone numbers must be in E.164 format for Twilio.

---

## 🆘 Troubleshooting

### Check Console Logs:
Look for these messages:
- `📱 Twilio Account SID: Set (...)` ✅ Good!
- `📱 Twilio Service SID: Set (...)` ✅ Good!
- `✅ Twilio verification initiated!` ✅ SMS sent!
- `❌ Twilio API error` ❌ Check credentials

### Common Issues:

**Issue 1:** "Twilio Account SID: Not Set"
- **Fix:** Make sure you added credentials in `node.env` file
- **Fix:** Restart server after updating `node.env`

**Issue 2:** "Twilio API error: Invalid phone number"
- **Fix:** Check phone number format (should be E.164: +923001234567)
- **Fix:** Make sure country code is included

**Issue 3:** "Twilio API error: Service not found"
- **Fix:** Check Service SID is correct (starts with VA...)
- **Fix:** Make sure Verify Service is created in Twilio console

**Issue 4:** "SMS service not configured"
- **Fix:** Add all three credentials in `node.env`:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_VERIFY_SERVICE_SID`
- **Fix:** Restart server

---

## 🔧 How It Works

1. **User enters phone number** → Backend formats it
2. **Backend calls Twilio Verify API** → Twilio sends OTP SMS
3. **User enters OTP** → Backend verifies with Twilio
4. **OTP verified** → User can reset password

**Note:** Twilio automatically generates and sends OTP. We store the verification SID for verification.

---

## 📞 Twilio Console Links

- **Dashboard:** https://www.twilio.com/console
- **Verify Services:** https://www.twilio.com/console/verify/services
- **Phone Numbers:** https://www.twilio.com/console/phone-numbers
- **Logs:** https://www.twilio.com/console/monitor/logs

---

## 💰 Pricing

**Free Trial:**
- $15.50 free credit
- Test phone numbers included
- Perfect for development

**After Trial:**
- SMS pricing varies by country
- Pakistan: ~$0.05-0.10 per SMS
- Check: https://www.twilio.com/pricing

---

**Need Help?** Check backend console logs for detailed error messages.

