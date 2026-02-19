# Fix "Access Blocked" Error - Quick Guide

## ⚠️ Error: "Access Blocked: This app's request is invalid"

Yeh error usually tab aata hai jab:
1. Redirect URI Google Console mein add nahi hai
2. OAuth Consent Screen properly configured nahi hai
3. Test users add nahi kiye gaye hain

## 🔧 Step-by-Step Fix

### Step 1: Add Redirect URI to WEB Client ID

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Click on WEB OAuth 2.0 Client ID**:
   - `189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com`
3. **Scroll to "Authorized redirect URIs"**
4. **Click "+ ADD URI"**
5. **Copy-paste this EXACT URI** (no trailing slash):
   ```
   https://auth.expo.io/@anonymous/autofinder
   ```
6. **Click "SAVE"**

### Step 2: Configure OAuth Consent Screen

1. **Go to**: https://console.cloud.google.com/apis/credentials/consent
2. **Fill required fields**:
   - **User Type**: External (for testing) or Internal
   - **App name**: `AutoFinder`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
3. **Click "SAVE AND CONTINUE"**
4. **Add Scopes**:
   - Click "+ ADD OR REMOVE SCOPES"
   - Search and select:
     - `openid`
     - `profile`
     - `email`
   - Click "UPDATE"
5. **Click "SAVE AND CONTINUE"**
6. **Add Test Users** (if app is in Testing mode):
   - Click "+ ADD USERS"
   - Add your Google email address (the one you'll use to sign in)
   - Click "ADD"
7. **Click "SAVE AND CONTINUE"**
8. **Review and click "BACK TO DASHBOARD"**

### Step 3: Wait and Test

1. **Wait 5-10 minutes** for Google to propagate changes
2. **Restart your app**:
   ```bash
   cd AutoFinder-App
   yarn start --clear
   ```
3. **Try Google Sign-In again**

## ✅ Verification Checklist

- [ ] Redirect URI added to **WEB Client ID** (not iOS/Android)
- [ ] Redirect URI is exact: `https://auth.expo.io/@anonymous/autofinder`
- [ ] OAuth Consent Screen configured
- [ ] App name set: `AutoFinder`
- [ ] Support email set
- [ ] Scopes added: `openid`, `profile`, `email`
- [ ] Test users added (if in Testing mode)
- [ ] Waited 5-10 minutes after changes
- [ ] App restarted with `--clear` flag

## 🎯 Important Notes

1. **Use WEB Client ID for redirect URI**: 
   - Expo proxy uses Web Client ID
   - Don't add redirect URI to iOS/Android Client IDs (they don't need it)

2. **OAuth Consent Screen is CRITICAL**:
   - Without it, you'll get "access blocked" error
   - Make sure all required fields are filled

3. **Test Users**:
   - If app is in "Testing" mode, you MUST add test users
   - Only test users can sign in during testing phase

4. **Wait Time**:
   - Google changes can take 5-10 minutes to propagate
   - Be patient and wait before testing again

## 🐛 Still Having Issues?

If you still get the error after following all steps:

1. **Check console logs** for exact error message
2. **Verify redirect URI** matches exactly (no trailing slash)
3. **Check OAuth Consent Screen** publishing status
4. **Verify test users** are added (if in Testing mode)
5. **Try clearing browser cache** and app cache

## 📞 Need More Help?

Check the error message in the app alert - it will show specific fix steps based on the error type.
