# 🚨 URGENT: Email Service Setup - 5 Minutes

## ⚡ Problem: "Email service not configured"

**Solution:** Add Brevo API key in `node.env` file

---

## 📝 Step-by-Step (5 minutes):

### Step 1: Sign Up for Brevo (2 min)
1. Open: **https://www.brevo.com/**
2. Click **"Sign up free"** (top right)
3. Enter email, password
4. Verify email (check inbox)

### Step 2: Get API Key (1 min)
1. Login: **https://app.brevo.com/**
2. Click your name (top right) → **"SMTP & API"**
3. Click **"API Keys"** tab
4. Click **"Generate a new API key"**
5. Name: `AutoFinder`
6. Permission: Select **"Send emails"**
7. Click **"Generate"**
8. **COPY THE API KEY** (long string starting with `xkeysib-`)

### Step 3: Verify Sender Email (1 min)
1. In Brevo dashboard, go to **"Senders & IPs"** → **"Senders"**
2. Click **"Add a sender"**
3. Enter your email (e.g., `noreply@autofinder.com` or your Gmail)
4. Click **"Save"**
5. Check email inbox → Click verification link

### Step 4: Update node.env File (30 sec)
1. Open: `autofinder-backend-orignal-/node.env`
2. Find this line:
   ```
   BREVO_API_KEY=your-brevo-api-key-here
   ```
3. Replace with your actual API key:
   ```
   BREVO_API_KEY=xkeysib-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
   ```
4. Update sender email:
   ```
   BREVO_SENDER_EMAIL=your-verified-email@gmail.com
   ```
5. **Save the file**

### Step 5: Restart Server (10 sec)
1. Stop server (Ctrl+C in terminal)
2. Start again:
   ```bash
   npm start
   # OR
   node index.js
   ```

### Step 6: Test (30 sec)
1. Open app
2. Go to Forgot Password
3. Enter email
4. Click "Send OTP"
5. Check email inbox! ✅

---

## ✅ That's It!

**Free Tier:**
- ✅ 300 emails per day
- ✅ No credit card needed
- ✅ Professional delivery
- ✅ Reliable service

---

## 🆘 Still Not Working?

### Check Console Logs:
Look for these messages:
- `📧 Brevo API Key: Set (...)` ✅ Good!
- `📧 Brevo API Key: Not Set` ❌ Add API key
- `❌ Brevo API authentication failed` ❌ Check API key or sender email

### Common Issues:

**Issue 1:** "Brevo API Key: Not Set"
- **Fix:** Make sure you added API key in `node.env` file
- **Fix:** Restart server after updating `node.env`

**Issue 2:** "Brevo API authentication failed"
- **Fix:** Check API key is correct (copy-paste again)
- **Fix:** Verify sender email in Brevo dashboard
- **Fix:** Make sure API key has "Send emails" permission

**Issue 3:** "Email service not configured"
- **Fix:** Add `BREVO_API_KEY` in `node.env` file
- **Fix:** Restart server

---

## 📞 Quick Test:

Visit: `http://localhost:8001/test-email-config`

This shows if email service is configured correctly.

---

## 💡 Alternative: Use Gmail SMTP

If Brevo doesn't work, use Gmail:

1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. In `node.env`, add:
   ```
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```
4. Restart server

---

**Need Help?** Check backend console logs for detailed error messages.

