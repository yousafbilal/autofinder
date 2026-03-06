# 🚀 QUICK EMAIL SETUP - 5 Minutes

## ⚡ Fastest Way to Get Email Working

### Step 1: Sign Up for Brevo (2 minutes)
1. Go to: **https://www.brevo.com/**
2. Click **"Sign up free"**
3. Enter your email and create password
4. Verify your email (check inbox)

### Step 2: Get API Key (1 minute)
1. Login: **https://app.brevo.com/**
2. Go to: **Settings** → **API Keys** 
   OR direct link: **https://app.brevo.com/settings/keys/api**
3. Click **"Generate a new API key"**
4. Name: `AutoFinder`
5. Permission: Select **"Send emails"**
6. Click **"Generate"**
7. **COPY THE API KEY** (it starts with `xkeysib-...`)

### Step 3: Verify Sender Email (1 minute)
1. Go to: **Senders & IP** → **Senders**
   OR: **https://app.brevo.com/senders**
2. Click **"Add a sender"**
3. Enter your email (can be Gmail: `your-email@gmail.com`)
4. Click **"Save"**
5. Check email inbox for verification
6. Click verification link

### Step 4: Update node.env File (30 seconds)
Open `node.env` file and replace:
```env
BREVO_API_KEY=your-brevo-api-key-here
BREVO_SENDER_EMAIL=noreply@autofinder.com
```

With your actual values:
```env
BREVO_API_KEY=xkeysib-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
BREVO_SENDER_EMAIL=your-verified-email@gmail.com
```

### Step 5: Restart Server (10 seconds)
```bash
# Stop server (Ctrl+C)
# Then start again
npm start
# OR
node index.js
```

### Step 6: Test (30 seconds)
1. Open app
2. Go to Forgot Password
3. Enter email
4. Click "Send OTP"
5. Check email inbox!

---

## ✅ That's It! Email Will Work Now

**Free Tier:**
- 300 emails per day
- No credit card needed
- Professional delivery
- Reliable service

---

## 🆘 Still Not Working?

### Check 1: API Key Format
- Should start with `xkeysib-`
- Should be long (60+ characters)
- No spaces

### Check 2: Sender Email
- Must be verified in Brevo dashboard
- Can be any email (Gmail, Outlook, etc.)

### Check 3: Server Restart
- Must restart after updating node.env
- Check console logs for errors

### Check 4: Test Endpoint
Visit: `http://localhost:8001/test-email-config`
This shows if configuration is correct.

---

## 📞 Need Help?

1. Check backend console logs
2. Visit: https://www.brevo.com/help/
3. Test endpoint: `/test-email-config`

