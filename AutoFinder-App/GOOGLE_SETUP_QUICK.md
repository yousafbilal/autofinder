# Quick Google Sign-In Setup Guide

## Current Configuration ✅
- **Redirect URI**: `https://auth.expo.io/@anonymous/autofinder`
- **Client ID**: `189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com`

## Step-by-Step Setup

### 1. Google Cloud Console Setup

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Select your project** (or create one)
3. **Click on your OAuth 2.0 Client ID** (ending in `.apps.googleusercontent.com`)
4. **Scroll to "Authorized redirect URIs"**
5. **Click "+ ADD URI"**
6. **Add this exact URI**:
   ```
   https://auth.expo.io/@anonymous/autofinder
   ```
7. **Click "SAVE"**

### 2. OAuth Consent Screen Setup

1. **Go to**: https://console.cloud.google.com/apis/credentials/consent
2. **Fill required fields**:
   - App name: `AutoFinder`
   - User support email: Your email
   - Developer contact: Your email
3. **Click "SAVE AND CONTINUE"**
4. **Add Scopes**:
   - Click "+ ADD OR REMOVE SCOPES"
   - Select: `openid`, `profile`, `email`
   - Click "UPDATE"
5. **Click "SAVE AND CONTINUE"**
6. **Add Test Users** (if app is in Testing mode):
   - Click "+ ADD USERS"
   - Add your Google email address
   - Click "ADD"
7. **Click "SAVE AND CONTINUE"**
8. **Review and click "BACK TO DASHBOARD"**

### 3. Verify Setup

After making changes:
1. **Wait 5-10 minutes** for changes to propagate
2. **Restart your app**: `yarn start --clear`
3. **Try Google Sign-In** again

## Common Issues & Solutions

### Issue: "redirect_uri_mismatch"
**Solution**: Make sure the redirect URI in Google Console matches exactly:
```
https://auth.expo.io/@anonymous/autofinder
```
(No trailing slash, exact match)

### Issue: "access_denied"
**Solution**: 
- Check OAuth consent screen is configured
- Add your email as test user (if in testing mode)
- Make sure scopes are added: `openid`, `profile`, `email`

### Issue: "invalid_client"
**Solution**: 
- Verify Client ID is correct: `189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com`
- Check you're using **Web Client ID** (not iOS/Android specific)

### Issue: No error but nothing happens
**Solution**:
- Check console logs for detailed error messages
- Verify backend `/google-login` endpoint is working
- Check network connectivity

## Testing Checklist

- [ ] Redirect URI added to Google Console
- [ ] OAuth consent screen configured
- [ ] Scopes added: `openid`, `profile`, `email`
- [ ] Test users added (if in testing mode)
- [ ] Waited 5-10 minutes after changes
- [ ] App restarted with `--clear` flag
- [ ] Backend server is running
- [ ] `/google-login` endpoint is accessible

## Need Help?

Check console logs for:
- Redirect URI being used
- Any error messages
- Backend response status

If still having issues, share the complete error message from console.
