# ✅ Google OAuth Setup - Verified Configuration

## Configured Client IDs

### ✅ iOS Client ID
- **Client ID**: `189347634725-b93nogflec3cdk5slh3puf1ktjohjinc.apps.googleusercontent.com`
- **Type**: iOS
- **Status**: ✅ Configured

### ✅ Android Client ID  
- **Client ID**: `189347634725-0123dltmgn23eomv6t6b8vr3ukc4jfco.apps.googleusercontent.com`
- **Type**: Android
- **Status**: ✅ Configured

### ✅ Web Client ID
- **Client ID**: `189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com`
- **Type**: Web application
- **Status**: ✅ Configured

## Required Configuration Steps

### 1. Add Redirect URI to ALL Client IDs

**Redirect URI to add** (same for all):
```
https://auth.expo.io/@anonymous/autofinder
```

#### For iOS Client ID:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click iOS Client ID: `189347634725-b93nogflec3cdk5slh3puf1ktjohjinc`
3. Add redirect URI: `https://auth.expo.io/@anonymous/autofinder`
4. Save

#### For Android Client ID:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click Android Client ID: `189347634725-0123dltmgn23eomv6t6b8vr3ukc4jfco`
3. Add redirect URI: `https://auth.expo.io/@anonymous/autofinder`
4. Save

#### For Web Client ID:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click Web Client ID: `189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl`
3. Scroll to "Authorized redirect URIs"
4. Add redirect URI: `https://auth.expo.io/@anonymous/autofinder`
5. Save

### 2. OAuth Consent Screen Configuration

1. **Go to**: https://console.cloud.google.com/apis/credentials/consent
2. **Verify**:
   - ✅ App name: `AutoFinder`
   - ✅ User support email: Your email
   - ✅ Scopes: `openid`, `profile`, `email`
   - ✅ Test users: Add your Google email (if in Testing mode)

### 3. Verify Package Names

#### iOS:
- **Bundle ID**: `com.adeel360.autofinder`
- Verify in Google Console matches `app.json`

#### Android:
- **Package Name**: `com.adeel360.autofinder`
- Verify in Google Console matches `app.json`

## Testing Checklist

- [ ] Redirect URI added to iOS Client ID
- [ ] Redirect URI added to Android Client ID
- [ ] Redirect URI added to Web Client ID
- [ ] OAuth Consent Screen configured
- [ ] Scopes added: `openid`, `profile`, `email`
- [ ] Test users added (if in Testing mode)
- [ ] Waited 5-10 minutes after changes
- [ ] App restarted with `--clear` flag

## How It Works

1. **iOS Device**: Uses iOS Client ID (`189347634725-b93nogflec3cdk5slh3puf1ktjohjinc`)
2. **Android Device**: Uses Android Client ID (`189347634725-0123dltmgn23eomv6t6b8vr3ukc4jfco`)
3. **Web/Other**: Uses Web Client ID (`189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl`)

## Current App Configuration

- **iOS Bundle ID**: `com.adeel360.autofinder`
- **Android Package**: `com.adeel360.autofinder`
- **Redirect URI**: `https://auth.expo.io/@anonymous/autofinder`

## Next Steps

1. **Add redirect URI to all 3 Client IDs** (if not already added)
2. **Wait 5-10 minutes** for changes to propagate
3. **Test on each platform**:
   - iOS device/simulator
   - Android device/emulator
   - Web browser

## Troubleshooting

If you still get "access blocked" error:

1. **Check redirect URI** is added to the correct Client ID:
   - iOS → iOS Client ID
   - Android → Android Client ID
   - Web → Web Client ID

2. **Verify exact match**:
   - No trailing slash
   - Exact: `https://auth.expo.io/@anonymous/autofinder`

3. **Check OAuth Consent Screen**:
   - App is configured
   - Test users added (if in Testing mode)

4. **Wait time**: Changes can take 5-10 minutes to propagate

## Success Indicators

✅ No "access blocked" error
✅ Google Sign-In popup opens
✅ User can select Google account
✅ Login successful
✅ User redirected to app
