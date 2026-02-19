# Fix "Error 400: invalid_request" - exp:// Protocol Issue

## ⚠️ Error: `redirect_uri=exp://192.168.100.6:8081`

Yeh error tab aata hai jab Expo development server `exp://` protocol use kar raha hai instead of `https://auth.expo.io`.

## 🔧 Solution: Add exp:// URI to Google Console

### Option 1: Add exp:// URI (Quick Fix)

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Click on WEB OAuth 2.0 Client ID**:
   - `189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com`
3. **Scroll to "Authorized redirect URIs"**
4. **Click "+ ADD URI"**
5. **Add this URI** (replace IP with your actual IP):
   ```
   exp://192.168.100.6:8081
   ```
   **OR** add wildcard pattern:
   ```
   exp://*
   ```
6. **Click "SAVE"**

### Option 2: Force https://auth.expo.io (Recommended)

Code mein explicit redirect URI set kar diya hai. Ab ensure karein:

1. **App restart karein**:
   ```bash
   cd AutoFinder-App
   yarn start --clear
   ```

2. **Check console logs** - redirect URI should be:
   ```
   https://auth.expo.io/@anonymous/autofinder
   ```

3. **Agar phir bhi exp:// use ho raha hai**, to Google Console mein dono add karein:
   - `https://auth.expo.io/@anonymous/autofinder` ✅ (already added)
   - `exp://192.168.100.6:8081` (add this too)

## 📋 Current Redirect URIs in Google Console

Should have:
- ✅ `https://auth.expo.io/@anonymous/autofinder`
- ✅ `http://localhost:8001/auth/google/callback`
- ⚠️ `exp://192.168.100.6:8081` (add if needed)

## 🎯 Recommended Approach

**Best**: Use `https://auth.expo.io/@anonymous/autofinder` (already configured)
- Works for all devices
- More stable
- Already added to Google Console

**Alternative**: Add `exp://` URI for development
- Only needed if Expo proxy not working
- IP address changes, so less stable

## ✅ Verification

After adding redirect URI:

1. **Wait 5-10 minutes** for Google to propagate changes
2. **Restart app**: `yarn start --clear`
3. **Try Google Sign-In again**
4. **Check console logs** for redirect URI being used

## 🐛 Still Having Issues?

1. **Check which redirect URI is being used**:
   - Look at error message: `redirect_uri=exp://...`
   - Add that exact URI to Google Console

2. **Try both approaches**:
   - Add `exp://192.168.100.6:8081` to Google Console
   - Ensure code uses `https://auth.expo.io/@anonymous/autofinder`

3. **Clear cache**:
   ```bash
   yarn start --clear
   ```

4. **Wait longer**:
   - Google changes can take 10-15 minutes
   - Be patient
