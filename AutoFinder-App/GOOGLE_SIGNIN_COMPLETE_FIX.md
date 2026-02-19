# 🔧 Complete Google Sign-In Fix - Step by Step

## ⚠️ Current Issue: "Access Blocked" Error

Yeh error tab aata hai jab Google Console mein proper configuration nahi hai.

## ✅ Code Status: FIXED

Code ab sahi hai:
- ✅ Redirect URI: `https://auth.expo.io/@anonymous/autofinder`
- ✅ Web Client ID configured: `189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com`
- ✅ All Client IDs provided

## 🔧 Google Console Setup (REQUIRED)

### Step 1: Add Redirect URI to WEB Client ID

1. **Open Google Cloud Console**:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Make sure you're in the correct project

2. **Find WEB OAuth 2.0 Client ID**:
   - Look for: `189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com`
   - Click on it to edit

3. **Add Redirect URI**:
   - Scroll down to "Authorized redirect URIs"
   - Click "+ ADD URI"
   - **Copy-paste this EXACT URI** (no spaces, no trailing slash):
     ```
     https://auth.expo.io/@anonymous/autofinder
     ```
   - Click "SAVE"

4. **Verify**:
   - Make sure the URI is added exactly as shown above
   - No trailing slash (`/`) at the end
   - No extra spaces

### Step 2: Configure OAuth Consent Screen

1. **Open OAuth Consent Screen**:
   - Go to: https://console.cloud.google.com/apis/credentials/consent
   - Make sure you're in the correct project

2. **Fill Required Information**:
   - **User Type**: Select "External" (for public apps) or "Internal" (for organization)
   - **App name**: `AutoFinder` (exact name)
   - **User support email**: Your verified email address
   - **Developer contact information**: Your verified email address
   - Click "SAVE AND CONTINUE"

3. **Add Scopes** (CRITICAL):
   - Click "+ ADD OR REMOVE SCOPES"
   - Search and select these EXACT scopes:
     - `openid` (OpenID Connect)
     - `profile` (See your profile information)
     - `email` (See your email address)
   - Click "UPDATE"
   - Click "SAVE AND CONTINUE"

4. **Add Test Users** (IF in Testing mode):
   - If your app is in "Testing" mode, you MUST add test users
   - Click "+ ADD USERS"
   - Add your Google email address (the one you'll use to sign in)
   - Click "ADD"
   - Click "SAVE AND CONTINUE"

5. **Review and Save**:
   - Review all information
   - Click "BACK TO DASHBOARD"

### Step 3: Verify Configuration

#### Check Redirect URI:
- ✅ Go to: https://console.cloud.google.com/apis/credentials
- ✅ Click on WEB Client ID
- ✅ Verify `https://auth.expo.io/@anonymous/autofinder` is in "Authorized redirect URIs"
- ✅ No trailing slash

#### Check OAuth Consent Screen:
- ✅ Go to: https://console.cloud.google.com/apis/credentials/consent
- ✅ Verify "Publishing status" is "Testing" or "In production"
- ✅ Verify scopes are added: `openid`, `profile`, `email`
- ✅ If in Testing mode, verify your email is in Test Users

### Step 4: Wait and Test

1. **Wait 10-15 minutes** after making changes (Google needs time to propagate)

2. **Restart App**:
   ```bash
   cd AutoFinder-App
   yarn start --clear
   ```

3. **Try Google Sign-In**:
   - Click "Continue with Google"
   - Check console logs for any errors
   - If error occurs, check the error message for specific fix steps

## 🐛 Troubleshooting

### Issue: Still getting "Access Blocked"

**Check these:**

1. **Redirect URI**:
   - Is it added to WEB Client ID (not iOS/Android)?
   - Is it exact match (no trailing slash)?
   - Wait 10-15 minutes after adding

2. **OAuth Consent Screen**:
   - Is it configured (not "Unpublished")?
   - Are scopes added?
   - If in Testing mode, is your email in Test Users?

3. **Client ID**:
   - Check console logs - which Client ID is being used?
   - Should be: `189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com`

### Issue: "redirect_uri_mismatch"

**Solution**:
- Make sure redirect URI in Google Console matches exactly: `https://auth.expo.io/@anonymous/autofinder`
- No trailing slash
- No extra spaces
- Added to WEB Client ID (not iOS/Android)

### Issue: "invalid_client"

**Solution**:
- Verify Client ID is correct
- Make sure you're using WEB Client ID for Expo proxy

## 📋 Quick Checklist

Before testing, verify:

- [ ] Redirect URI added to WEB Client ID: `https://auth.expo.io/@anonymous/autofinder`
- [ ] OAuth Consent Screen configured
- [ ] App name set: `AutoFinder`
- [ ] Scopes added: `openid`, `profile`, `email`
- [ ] Test Users added (if in Testing mode)
- [ ] Waited 10-15 minutes after changes
- [ ] App restarted with `--clear` flag

## 🎯 Still Not Working?

1. **Check Console Logs**:
   - Look for "Client ID in Request URL" - should be Web Client ID
   - Look for error messages with fix steps

2. **Verify in Google Console**:
   - Double-check redirect URI is added
   - Double-check OAuth Consent Screen is saved
   - Check if app is in Testing mode (need test users)

3. **Try Again**:
   - Wait another 10-15 minutes
   - Clear app cache
   - Restart app

## 📞 Need Help?

Check the error message in the app - it will show specific fix steps based on the error type.
