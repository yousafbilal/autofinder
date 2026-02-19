# Fix "Error 400: redirect_uri_mismatch"

## ⚠️ Error: `redirect_uri_mismatch`

Yeh error tab aata hai jab Google Console mein jo redirect URI add kiya hai, wo code se jo redirect URI bhej raha hai usse match nahi kar raha.

## 🔧 Step-by-Step Fix

### Step 1: Check Actual Redirect URI Being Used

1. **App start karein** aur console logs check karein
2. **"Continue with Google" click karein**
3. **Console mein yeh dikhega**:
   ```
   🔐 Google Sign-In - Redirect URI: [actual URI]
   ```
4. **Yeh exact URI copy karein**

### Step 2: Add Redirect URI to Google Console

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Click on WEB OAuth 2.0 Client ID**:
   - `189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com`
3. **Scroll to "Authorized redirect URIs"**
4. **Check karein ki yeh URIs add hain**:
   - `https://auth.expo.io/@anonymous/autofinder` ✅
   - `exp://192.168.100.6:8081` (agar Expo dev server use ho raha hai)
   - `exp://localhost:8081` (agar localhost use ho raha hai)
5. **Agar console mein jo URI dikh raha hai wo add nahi hai**, to:
   - Click "+ ADD URI"
   - Copy-paste exact URI from console
   - Click "SAVE"

### Step 3: Common Redirect URIs to Add

Add these URIs to cover all scenarios:

```
https://auth.expo.io/@anonymous/autofinder
exp://192.168.100.6:8081
exp://localhost:8081
exp://127.0.0.1:8081
```

**OR** add wildcard pattern (if supported):
```
exp://*
```

### Step 4: Wait and Test

1. **Wait 5-10 minutes** for Google to propagate changes
2. **Restart app**:
   ```bash
   cd AutoFinder-App
   yarn start --clear
   ```
3. **Check console logs** for redirect URI
4. **Try Google Sign-In again**

## 🎯 Quick Fix: Add All Possible URIs

Google Console mein yeh sab URIs add karein:

1. `https://auth.expo.io/@anonymous/autofinder` ✅ (already added)
2. `exp://192.168.100.6:8081` (your current IP)
3. `exp://localhost:8081` (for localhost)
4. `exp://127.0.0.1:8081` (for localhost IP)
5. `http://localhost:8001/auth/google/callback` ✅ (already added)

## 📋 Verification Checklist

- [ ] Check console logs for actual redirect URI
- [ ] Add that exact URI to Google Console
- [ ] Add common Expo URIs (exp://)
- [ ] Wait 5-10 minutes
- [ ] Restart app with `--clear`
- [ ] Try Google Sign-In again

## 🐛 Debugging

### Check Redirect URI in Code:

1. **Console logs check karein** when clicking "Continue with Google"
2. **Look for**: `🔐 Google Sign-In - Redirect URI: [URI]`
3. **Yeh exact URI Google Console mein add karein**

### Common Issues:

1. **IP Address Changed**:
   - Agar `exp://192.168.100.6:8081` use ho raha hai
   - Aur IP change ho gaya hai
   - To nayi IP ke saath URI add karein

2. **Expo Proxy Not Working**:
   - Agar `exp://` use ho raha hai instead of `https://auth.expo.io`
   - To `exp://` URIs add karein
   - Ya phir Expo proxy fix karein

3. **Multiple URIs Needed**:
   - Different environments different URIs use karte hain
   - Sab add karein to be safe

## ✅ Success Indicators

- ✅ No "redirect_uri_mismatch" error
- ✅ Redirect URI in console matches Google Console
- ✅ Google Sign-In popup opens
- ✅ Login successful
