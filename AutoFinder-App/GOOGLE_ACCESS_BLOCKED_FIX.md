# Fix "Access Blocked" Error - Step by Step

## Current Configuration
- **Web Client ID**: `189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com`
- **Android Client ID**: `189347634725-0123dltmgn23eomv6t6b8vr3ukc4jfco.apps.googleusercontent.com`
- **Redirect URI**: `https://auth.expo.io/@anonymous/autofinder`

## ⚠️ IMPORTANT: Use Web Client ID with Expo Proxy

When using Expo proxy (`useProxy: true`), you **MUST** use the **Web Client ID**, not Android Client ID.

## Step 1: Add Redirect URI to Google Console

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Click on your WEB OAuth 2.0 Client ID**:
   - `189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com`
3. **Scroll down to "Authorized redirect URIs"**
4. **Click "+ ADD URI"**
5. **Copy-paste this EXACT URI** (no trailing slash):
   ```
   https://auth.expo.io/@anonymous/autofinder
   ```
6. **Click "SAVE"**

## Step 2: Configure OAuth Consent Screen

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

## Step 3: Verify Configuration

### Check Redirect URI:
- ✅ Added to **WEB Client ID** (not Android)
- ✅ Exact match: `https://auth.expo.io/@anonymous/autofinder`
- ✅ No trailing slash

### Check OAuth Consent Screen:
- ✅ App name set
- ✅ Support email set
- ✅ Scopes added: `openid`, `profile`, `email`
- ✅ Test users added (if in testing mode)

## Step 4: Wait and Test

1. **Wait 5-10 minutes** for Google to propagate changes
2. **Restart your app**:
   ```bash
   cd AutoFinder-App
   yarn start --clear
   ```
3. **Try Google Sign-In again**

## Common Errors & Solutions

### Error: "redirect_uri_mismatch"
**Solution**: 
- Make sure redirect URI is added to **WEB Client ID** (not Android)
- Check exact match (no trailing slash)
- Wait 5-10 minutes after adding

### Error: "access_denied" or "access_blocked"
**Solution**:
- Check OAuth Consent Screen is configured
- Add your email as Test User (if in testing mode)
- Make sure scopes are added

### Error: "invalid_client"
**Solution**:
- Verify you're using **Web Client ID**: `189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com`
- Check Client ID exists in Google Console

## Quick Checklist

- [ ] Redirect URI added to **WEB Client ID**
- [ ] OAuth Consent Screen configured
- [ ] Scopes added: `openid`, `profile`, `email`
- [ ] Test users added (if in testing mode)
- [ ] Waited 5-10 minutes
- [ ] App restarted with `--clear` flag

## Still Having Issues?

1. Check console logs for exact error message
2. Verify redirect URI in logs matches Google Console
3. Make sure you're using **Web Client ID** (not Android)
4. Check OAuth Consent Screen publishing status
