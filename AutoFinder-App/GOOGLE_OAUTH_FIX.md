# Google OAuth Authorization Error Fix

## Common Issues and Solutions

### Issue: "Access Blocked: This app's request is invalid"

This error occurs when the redirect URI doesn't match what's configured in Google Cloud Console.

## Solution Steps:

### 1. Get Your Expo Redirect URI

When you run the app, check the console logs. You'll see:
```
🔐 Google Sign-In - Redirect URI: https://auth.expo.io/@your-username/autofinder
```

Copy this exact URI.

### 2. Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID (the one ending in `.apps.googleusercontent.com`)
5. Under **Authorized redirect URIs**, add:
   - `https://auth.expo.io/@your-username/autofinder`
   - `https://auth.expo.io/@your-username/autofinder/oauth`
   - `autofinder://oauth` (for deep linking)

### 3. OAuth Consent Screen Setup

1. Go to **APIs & Services** > **OAuth consent screen**
2. Make sure:
   - User Type: **External** (for testing) or **Internal** (for organization)
   - App name: **AutoFinder**
   - User support email: Your email
   - Scopes: `openid`, `profile`, `email`
   - Test users: Add your Google email for testing

### 4. Verify Client ID

Make sure you're using the **Web Client ID** (not iOS/Android specific):
- Format: `xxxxx.apps.googleusercontent.com`
- Check in `config.js`: `GOOGLE_CLIENT_ID`

### 5. Test Again

After updating Google Console:
1. Wait 5-10 minutes for changes to propagate
2. Clear app cache: `expo start --clear`
3. Try Google Sign-In again

## Alternative: Use Production Redirect URI

If you're deploying to production, you'll need:
- Production redirect URI: `https://your-domain.com/oauth/callback`
- Add this to Google Console as well

## Debugging

Check console logs for:
- Redirect URI being used
- Client ID being used
- Any error messages from Google

If still having issues, check:
1. Google Cloud Console > APIs & Services > OAuth consent screen > Publishing status
2. Make sure OAuth consent screen is published (or add test users)
3. Verify the Client ID matches exactly
