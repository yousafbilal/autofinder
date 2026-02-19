# Quick Fix: redirect_uri_mismatch Error

## ⚠️ Error: `redirect_uri_mismatch`

Yeh error tab aata hai jab Google Console mein jo redirect URI add kiya hai, wo code se jo redirect URI bhej raha hai usse match nahi kar raha.

## 🔧 Quick Fix Steps

### Step 1: Check Actual Redirect URI

1. **App start karein** aur "Continue with Google" click karein
2. **Console logs check karein** - yeh dikhega:
   ```
   🔐 Actual Request Redirect URI: [actual URI]
   ```
3. **Yeh exact URI copy karein**

### Step 2: Add to Google Console

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Click on WEB OAuth 2.0 Client ID**:
   - `189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com`
3. **Scroll to "Authorized redirect URIs"**
4. **Click "+ ADD URI"**
5. **Paste the exact URI from console** (jo console mein dikha)
6. **Click "SAVE"**

### Step 3: Common URIs to Add

Agar unsure ho, to yeh sab URIs add karein:

```
https://auth.expo.io/@anonymous/autofinder
exp://192.168.100.6:8081
exp://localhost:8081
exp://127.0.0.1:8081
```

### Step 4: Wait and Test

1. **Wait 5-10 minutes** for Google to propagate changes
2. **Restart app**: `yarn start --clear`
3. **Try Google Sign-In again**

## 🎯 Most Common Issue

Agar console mein `exp://192.168.100.6:8081` dikh raha hai:

1. **Google Console mein yeh URI add karein**:
   ```
   exp://192.168.100.6:8081
   ```

2. **Ya phir app restart karein** - shayad `https://auth.expo.io/@anonymous/autofinder` use ho jaye

## ✅ Success

- ✅ No "redirect_uri_mismatch" error
- ✅ Google Sign-In popup opens
- ✅ Login successful
