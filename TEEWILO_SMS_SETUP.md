# 📱 TEEWILO SMS SETUP - For Password Reset OTP

## ⚡ Quick Setup

### Step 1: Get Teewilo API Credentials
1. Login to your Teewilo account
2. Go to API Settings / Dashboard
3. Get your API Key
4. Note your API URL (endpoint)
5. Note your Sender ID (registered sender name)

### Step 2: Update node.env File
Open `node.env` file and add:
```env
TEEWILO_API_KEY=your-actual-teewilo-api-key-here
TEEWILO_API_URL=https://api.teewilo.com/sms/send
TEEWILO_SENDER_ID=AutoFinder
```

**Note:** Adjust `TEEWILO_API_URL` and `TEEWILO_SENDER_ID` based on your Teewilo account settings.

### Step 3: Restart Server
```bash
# Stop server (Ctrl+C)
# Then start again
npm start
# OR
node index.js
```

### Step 4: Test
1. Open app
2. Go to Forgot Password
3. Enter phone number (e.g., 03001234567)
4. Click "Send OTP"
5. Check SMS! ✅

---

## 🔧 API Configuration

The code currently uses this format:
```javascript
{
  to: "923001234567",  // Phone number (with country code, no +)
  message: "Your AutoFinder password reset OTP is: 123456...",
  sender_id: "AutoFinder"
}
```

**If your Teewilo API uses different field names, please provide:**
- Request body format
- Required headers
- Response format
- Any authentication method

---

## 📝 Phone Number Format

The code automatically:
- Removes spaces and dashes
- Adds Pakistan country code (92) if missing
- Removes leading 0 if present
- Formats as: `92XXXXXXXXX` (without +)

**Examples:**
- `03001234567` → `923001234567`
- `+923001234567` → `923001234567`
- `923001234567` → `923001234567`

---

## 🆘 Troubleshooting

### Check Console Logs:
Look for these messages:
- `📱 Teewilo API Key: Set (...)` ✅ Good!
- `📱 Teewilo API Key: Not Set` ❌ Add API key
- `❌ Teewilo API error` ❌ Check API key or format

### Common Issues:

**Issue 1:** "Teewilo API Key: Not Set"
- **Fix:** Make sure you added API key in `node.env` file
- **Fix:** Restart server after updating `node.env`

**Issue 2:** "Teewilo API error"
- **Fix:** Check API key is correct
- **Fix:** Verify API URL is correct
- **Fix:** Check request body format matches Teewilo API
- **Fix:** Verify Sender ID is registered in Teewilo

**Issue 3:** "SMS service not configured"
- **Fix:** Add `TEEWILO_API_KEY` in `node.env` file
- **Fix:** Restart server

---

## 📞 Need to Adjust API Format?

If Teewilo API uses different format, provide:
1. API endpoint URL
2. Request body structure
3. Headers required
4. Response format

Then I can update the code accordingly.

---

**Current Implementation:**
- Phone number validation
- Automatic country code addition
- SMS message formatting
- Error handling
- Development mode test OTP

