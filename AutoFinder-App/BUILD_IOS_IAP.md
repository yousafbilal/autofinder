# 🚀 Quick Start: Build iOS App for IAP Testing

## ⚡ Fast Commands

### 1. Install EAS CLI (First Time Only)
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
cd AutoFinder-App
eas login
```

### 3. Build iOS App (Preview - for Testing IAP)
```bash
npm run build:ios
```

**OR**

```bash
eas build --platform ios --profile preview
```

---

## 📱 What Happens Next?

1. **EAS will ask for:**
   - Apple Developer account credentials
   - App Store Connect API key (if not configured)
   - Build configuration

2. **Build Process:**
   - Takes 15-30 minutes
   - Builds on Expo servers
   - Creates `.ipa` file

3. **After Build:**
   - Download link will be provided
   - Install on iPhone via TestFlight or Xcode
   - Test IAP functionality

---

## ✅ Before Building - Checklist

- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged into Expo: `eas login`
- [ ] Apple Developer account active ($99/year)
- [ ] App Store Connect app created
- [ ] IAP product created: `dealer_monthly_ios`
- [ ] Backend `.env` has `APPLE_SHARED_SECRET`

---

## 🎯 Test IAP After Install

1. Open app on iPhone
2. Login
3. Go to: **More → Dealer Packages**
4. Select package
5. Tap **"Buy Now"**
6. **Apple IAP sheet will appear!** ✅
7. Complete purchase
8. Dealer status activated

---

## 📖 Full Guide

See `IOS_IAP_BUILD_GUIDE.md` for detailed instructions.

---

## 🆘 Need Help?

```bash
# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Check EAS status
eas whoami
```

**Ready to build? Run: `npm run build:ios`** 🚀


