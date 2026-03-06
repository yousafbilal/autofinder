# 📧 Email Setup Guide for Forgot Password OTP

## ✅ RECOMMENDED: Brevo (Sendinblue) - FREE 300 emails/day

### Step 1: Create Free Account
1. Go to: https://www.brevo.com/
2. Click "Sign up free"
3. Create account (No credit card required)
4. Verify your email

### Step 2: Get API Key
1. Login to Brevo dashboard: https://app.brevo.com/
2. Go to: **Settings** → **API Keys** (or visit: https://app.brevo.com/settings/keys/api)
3. Click **"Generate a new API key"**
4. Name: `AutoFinder OTP`
5. Permissions: Select **"Send emails"** only
6. Click **"Generate"**
7. **Copy the API key** (starts with `xkeysib-...`)

### Step 3: Verify Sender Email
1. Go to: **Senders & IP** → **Senders** (or visit: https://app.brevo.com/senders)
2. Click **"Add a sender"**
3. Enter your email (e.g., `noreply@autofinder.com` or your Gmail)
4. Click **"Save"**
5. Check your email inbox for verification email
6. Click the verification link

### Step 4: Update node.env File
Open `node.env` file and add:
```env
BREVO_API_KEY=xkeysib-your-actual-api-key-here
BREVO_SENDER_EMAIL=your-verified-email@example.com
```

### Step 5: Restart Server
Restart your backend server to load new configuration.

### Step 6: Test
1. Use forgot password feature in app
2. Check email inbox for OTP
3. If successful, you'll see: "OTP sent to your email"

---

## 🔄 Alternative: Gmail SMTP (If Brevo doesn't work)

### Step 1: Enable 2-Step Verification
1. Go to: https://myaccount.google.com/security
2. Enable **"2-Step Verification"**

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **"Mail"** and **"Other (Custom name)"**
3. Enter: `AutoFinder`
4. Click **"Generate"**
5. Copy the **16-character password** (remove spaces)

### Step 3: Update node.env File
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
```

### Step 4: Restart Server
Restart your backend server.

---

## 🧪 Test Email Configuration

Visit: `http://your-server:8001/test-email-config`

This will show you:
- Whether Brevo API is configured
- Whether SMTP is configured
- Recommendations

---

## ❓ Troubleshooting

### Issue: "Email service not configured"
**Solution:** Set `BREVO_API_KEY` in `node.env` file

### Issue: "Gmail authentication failed"
**Solution:** 
- Make sure you're using App Password (16 characters), not regular password
- Enable 2-Step Verification
- Or use Brevo API instead (easier)

### Issue: "Brevo API error"
**Solution:**
- Verify sender email is verified in Brevo dashboard
- Check API key is correct
- Make sure API key has "Send emails" permission

---

## 📞 Support

If you need help:
1. Check backend console logs for detailed errors
2. Visit: https://www.brevo.com/help/ for Brevo support
3. Test endpoint: `/test-email-config` to check configuration

