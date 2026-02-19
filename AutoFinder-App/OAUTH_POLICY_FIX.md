# Fix "Error 400: invalid_request" - OAuth 2.0 Policy Compliance

## ⚠️ Error: "Access blocked: Authorization Error - Error 400: invalid_request"

Yeh error Google's OAuth 2.0 policy compliance issue hai. Yeh usually tab aata hai jab:

1. OAuth Consent Screen properly configured nahi hai
2. App verification pending hai
3. Redirect URI mismatch hai
4. Required scopes properly configured nahi hain

## 🔧 Step-by-Step Fix

### Step 1: OAuth Consent Screen - Complete Setup

1. **Go to**: https://console.cloud.google.com/apis/credentials/consent
2. **Check Publishing Status**:
   - Agar "Testing" mode hai, to Test Users add karein
   - Agar "In production" hai, to app verification complete honi chahiye

3. **Fill ALL Required Fields**:
   - **User Type**: External (for public apps) or Internal (for organization)
   - **App name**: `AutoFinder` (exact name)
   - **User support email**: Your email (must be verified)
   - **Developer contact information**: Your email (must be verified)
   - **App logo**: Upload a logo (optional but recommended)
   - **App domain**: `autofinder.pk` (if you have one)
   - **Application home page**: `https://autofinder.pk` (if you have one)
   - **Privacy policy URL**: Add privacy policy URL (REQUIRED for production)
   - **Terms of service URL**: Add terms of service URL (REQUIRED for production)

4. **Add Scopes** (CRITICAL):
   - Click "+ ADD OR REMOVE SCOPES"
   - Search and select these EXACT scopes:
     - `openid` (OpenID Connect)
     - `https://www.googleapis.com/auth/userinfo.profile` (See your profile information)
     - `https://www.googleapis.com/auth/userinfo.email` (See your email address)
   - Click "UPDATE"
   - Click "SAVE AND CONTINUE"

5. **Add Test Users** (if in Testing mode):
   - Click "+ ADD USERS"
   - Add your Google email: `akaymernstack001@gmail.com`
   - Add any other test emails
   - Click "ADD"
   - Click "SAVE AND CONTINUE"

6. **Review and Submit**:
   - Review all information
   - Click "BACK TO DASHBOARD"

### Step 2: Verify Redirect URI in WEB Client ID

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Click on WEB OAuth 2.0 Client ID**:
   - `189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com`
3. **Check "Authorized redirect URIs"**:
   - Should have: `https://auth.expo.io/@anonymous/autofinder`
   - If not, add it and click "SAVE"

### Step 3: Check App Verification Status

1. **Go to**: https://console.cloud.google.com/apis/credentials/consent
2. **Check "Publishing status"**:
   - **Testing**: Only test users can sign in (add test users)
   - **In production**: App must be verified by Google (can take time)

### Step 4: For Testing Mode (Quick Fix)

Agar app "Testing" mode mein hai:

1. **Add Test Users**:
   - Go to OAuth Consent Screen
   - Click "Test users"
   - Click "+ ADD USERS"
   - Add: `akaymernstack001@gmail.com`
   - Click "ADD"

2. **Use Test Email**:
   - Sign in with the test email you added
   - Other emails won't work in Testing mode

### Step 5: For Production Mode

Agar app "In production" mode mein hai:

1. **App Verification Required**:
   - Google will verify your app
   - This can take several days
   - Make sure all required fields are filled

2. **Privacy Policy & Terms Required**:
   - Must have valid Privacy Policy URL
   - Must have valid Terms of Service URL
   - Both URLs must be accessible

## ✅ Verification Checklist

- [ ] OAuth Consent Screen fully configured
- [ ] All required fields filled (name, email, etc.)
- [ ] Scopes added: `openid`, `profile`, `email`
- [ ] Test users added (if in Testing mode)
- [ ] Redirect URI added to WEB Client ID
- [ ] Privacy Policy URL added (for production)
- [ ] Terms of Service URL added (for production)
- [ ] Waited 5-10 minutes after changes
- [ ] App restarted with `--clear` flag

## 🎯 Quick Fix for Testing

Agar aap testing kar rahe hain:

1. **Go to**: https://console.cloud.google.com/apis/credentials/consent
2. **Make sure app is in "Testing" mode**
3. **Add Test Users**:
   - Click "Test users"
   - Add: `akaymernstack001@gmail.com`
   - Save
4. **Wait 5 minutes**
5. **Try signing in with test email**

## 🐛 Common Issues

### Issue: "App doesn't comply with Google's OAuth 2.0 policy"
**Solution**: 
- Complete OAuth Consent Screen setup
- Add Privacy Policy URL (even if placeholder)
- Add Terms of Service URL (even if placeholder)
- Make sure all required fields are filled

### Issue: "Error 400: invalid_request"
**Solution**:
- Check redirect URI matches exactly
- Verify scopes are correctly added
- Make sure OAuth Consent Screen is saved

### Issue: "Access blocked" even after setup
**Solution**:
- Check if you're using test email (if in Testing mode)
- Verify app is not in "Unpublished" state
- Wait 10-15 minutes for changes to propagate

## 📞 Still Having Issues?

1. **Check OAuth Consent Screen status**:
   - Should be "Testing" or "In production"
   - Should not be "Unpublished"

2. **Verify test users** (if in Testing mode):
   - Must add exact email you're using to sign in
   - Email must be verified Google account

3. **Check redirect URI**:
   - Must be exact: `https://auth.expo.io/@anonymous/autofinder`
   - No trailing slash
   - Added to WEB Client ID only

4. **Wait time**:
   - Changes can take 10-15 minutes to propagate
   - Be patient and wait before testing again
