# iOS IAP Build Guide - Apple In-App Purchase Testing

## 🎯 Overview
This guide will help you build an iOS app with EAS (Expo Application Services) to test Apple In-App Purchase (IAP) functionality.

**Important:** Apple IAP only works in:
- ✅ EAS Build (iOS)
- ✅ App Store Build
- ❌ Expo Go (development mode only - no real IAP)

---

## 📋 Prerequisites

1. **Expo Account** - Sign up at https://expo.dev
2. **Apple Developer Account** - Required for iOS builds ($99/year)
3. **EAS CLI** - Install globally:
   ```bash
   npm install -g eas-cli
   ```

4. **Login to Expo:**
   ```bash
   eas login
   ```

---

## 🚀 Step-by-Step Build Process

### Step 1: Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
cd AutoFinder-App
eas login
```

### Step 3: Configure Apple Developer Account
You need to link your Apple Developer account:

```bash
eas build:configure
```

This will:
- Ask for your Apple Developer account credentials
- Set up certificates and provisioning profiles
- Configure your bundle identifier

**Note:** Make sure your `bundleIdentifier` in `app.json` matches your App Store Connect app:
```json
"ios": {
  "bundleIdentifier": "com.adeel360.autofinder"
}
```

### Step 4: Build iOS Preview Build (for testing IAP)
```bash
npm run build:ios:preview
```

Or directly:
```bash
eas build --platform ios --profile preview
```

**This will:**
- Build an iOS app with native IAP support
- Create a `.ipa` file
- Upload to Expo servers
- Provide download link

### Step 5: Install on Device
After build completes:
1. Download the `.ipa` file from Expo dashboard
2. Install on your iPhone using:
   - **TestFlight** (recommended for testing)
   - **Xcode** (for direct device install)
   - **Apple Configurator 2**

### Step 6: Test IAP
Once installed:
1. Open the app on your iPhone
2. Navigate to: **More → Dealer Packages**
3. Select a package
4. Tap **"Buy Now"**
5. **Apple IAP sheet will appear** (not in Expo Go!)
6. Complete purchase with test account
7. Backend will verify receipt and activate dealer status

---

## 🔧 Build Profiles

### Preview Build (Testing)
```bash
npm run build:ios:preview
```
- For internal testing
- IAP works with sandbox accounts
- Can install via TestFlight or direct install

### Production Build (App Store)
```bash
npm run build:ios:production
```
- For App Store submission
- IAP works with real purchases
- Must submit to App Store Connect

---

## 📱 App Store Connect Setup (Required for IAP)

### 1. Create App in App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Create new app with bundle ID: `com.adeel360.autofinder`
3. Fill in app details

### 2. Create In-App Purchase Product
1. Go to **App Store Connect → Your App → Features → In-App Purchases**
2. Click **"+"** to create new IAP
3. Select **"Auto-Renewable Subscription"**
4. Product ID: `dealer_monthly_ios` (must match code)
5. Set price and subscription details
6. Save and submit for review

### 3. Configure Shared Secret
1. Go to **App Store Connect → Users and Access → Keys → In-App Purchase**
2. Generate or copy **Shared Secret**
3. Add to backend `.env`:
   ```
   APPLE_SHARED_SECRET=your_shared_secret_here
   ```

---

## 🧪 Testing IAP

### Sandbox Testing Account
1. Create sandbox tester in App Store Connect:
   - **Users and Access → Sandbox Testers**
   - Add test email (must be different from your Apple ID)
2. Sign out of App Store on test device
3. When IAP sheet appears, use sandbox account
4. Test purchase will complete (no real charge)

### Test Scenarios
- ✅ Successful purchase
- ✅ Receipt verification
- ✅ Dealer status activation
- ✅ Package duration (10, 25, 30 days)
- ✅ Expired token handling

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Check EAS status
eas build:list

# View build logs
eas build:view [build-id]
```

### IAP Not Working
1. **Check Product ID:** Must match `dealer_monthly_ios` in App Store Connect
2. **Check Bundle ID:** Must match `com.adeel360.autofinder`
3. **Check Shared Secret:** Must be set in backend `.env`
4. **Check Sandbox Account:** Must be signed out of App Store

### "Cannot find native module 'ExpoInAppPurchases'"
- This is normal in Expo Go
- Use EAS build instead

### Token Expired Error
- Login again to get fresh token
- Token expires after some time

---

## 📝 Quick Commands Reference

```bash
# Login to Expo
eas login

# Configure build
eas build:configure

# Build iOS preview
npm run build:ios:preview

# Build iOS production
npm run build:ios:production

# View builds
eas build:list

# Submit to App Store
npm run submit:ios
```

---

## ✅ Success Checklist

- [ ] EAS CLI installed
- [ ] Logged into Expo
- [ ] Apple Developer account linked
- [ ] Bundle ID configured in `app.json`
- [ ] IAP product created in App Store Connect
- [ ] Product ID matches: `dealer_monthly_ios`
- [ ] Shared Secret added to backend `.env`
- [ ] iOS build completed successfully
- [ ] App installed on device
- [ ] IAP sheet appears when tapping "Buy Now"
- [ ] Purchase completes successfully
- [ ] Backend verifies receipt
- [ ] Dealer status activated

---

## 🎉 Next Steps

After successful IAP testing:
1. Test all package durations (10, 25, 30 days)
2. Test receipt verification
3. Test dealer features activation
4. Submit to App Store for review
5. Provide demo account to Apple reviewers

---

## 📞 Support

If you encounter issues:
1. Check build logs: `eas build:view [build-id]`
2. Check backend logs for receipt verification
3. Verify App Store Connect IAP product configuration
4. Ensure Shared Secret is correct

**Happy Testing! 🚀**


