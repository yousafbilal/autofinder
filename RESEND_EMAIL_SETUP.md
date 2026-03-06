# 🚀 RESEND EMAIL SETUP - 2 Minutes (EASIEST)

## ⚡ Fastest Way to Get Email Working

Resend is the **EASIEST** email service to set up - no email verification needed for testing!

---

## 📝 Step-by-Step (2 minutes):

### Step 1: Sign Up for Resend (1 min)
1. Go to: **https://resend.com/**
2. Click **"Get Started"** or **"Sign Up"**
3. Enter your email and create password
4. Verify your email (check inbox)

### Step 2: Get API Key (30 sec)
1. After login, go to: **https://resend.com/api-keys**
2. Click **"Create API Key"**
3. Name: `AutoFinder OTP`
4. Permission: Select **"Sending access"**
5. Click **"Add"**
6. **COPY THE API KEY** (it starts with `re_...`)

### Step 3: Update node.env File (30 sec)
Open `node.env` file and add:
```env
RESEND_API_KEY=re_your-actual-api-key-here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**Note:** For testing, you can use `onboarding@resend.dev` (no verification needed!)
For production, add your own domain in Resend dashboard.

### Step 4: Restart Server (10 sec)
```bash
# Stop server (Ctrl+C)
# Then start again
npm start
# OR
node index.js
```

### Step 5: Test (30 sec)
1. Open app
2. Go to Forgot Password
3. Enter email
4. Click "Send OTP"
5. Check email inbox! ✅

---

## ✅ That's It! Email Will Work Now

**Free Tier:**
- ✅ 100 emails per day
- ✅ No credit card needed
- ✅ No email verification needed for testing
- ✅ Professional delivery
- ✅ Reliable service

---

## 🆘 Still Not Working?

### Check Console Logs:
Look for these messages:
- `📧 Resend API Key: Set (...)` ✅ Good!
- `📧 Resend API Key: Not Set` ❌ Add API key
- `❌ Resend API error` ❌ Check API key

### Common Issues:

**Issue 1:** "Resend API Key: Not Set"
- **Fix:** Make sure you added API key in `node.env` file
- **Fix:** Restart server after updating `node.env`

**Issue 2:** "Resend API error"
- **Fix:** Check API key is correct (starts with `re_`)
- **Fix:** Make sure API key has "Sending access" permission

**Issue 3:** "Email service not configured"
- **Fix:** Add `RESEND_API_KEY` in `node.env` file
- **Fix:** Restart server

---

## 📞 Quick Test:

Visit: `http://localhost:8001/test-email-config`

This shows if email service is configured correctly.

---

## 💡 Why Resend?

1. **Easiest Setup** - No email verification needed for testing
2. **Fast** - API responds quickly
3. **Reliable** - Good deliverability
4. **Free** - 100 emails/day free
5. **Simple** - Just API key, no complex config

---

## 🔄 Alternative: Brevo (More Emails)

If you need more emails (300/day), use Brevo:
1. Sign up: https://www.brevo.com/
2. Get API key
3. Add `BREVO_API_KEY` in `node.env`

---

**Need Help?** Check backend console logs for detailed error messages.

