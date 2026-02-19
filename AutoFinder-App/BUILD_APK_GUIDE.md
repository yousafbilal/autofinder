# AutoFinder APK Build Guide (اردو/English)

## 📱 APK Generate Karne Ka Complete Guide

### Prerequisites (Pehle Ye Install Karo)

1. **Node.js** (v16 ya usse zyada) - [Download](https://nodejs.org/)
2. **Expo CLI** - Install karne ke liye:
   ```bash
   npm install -g expo-cli eas-cli
   ```
3. **EAS Account** - Expo account banana zaroori hai

---

## 🚀 Method 1: EAS Build (Recommended - Cloud Build)

### Step 1: EAS CLI Install Karo
```bash
npm install -g eas-cli
```

### Step 2: Login Karo
```bash
eas login
```
Agar account nahi hai to:
```bash
eas register
```

### Step 3: EAS Project Configure Karo
```bash
cd AutoFinder-App
eas build:configure
```

### Step 4: APK Build Karo

**Preview/Testing APK (Fast):**
```bash
npm run build:android:apk
```

**Production APK (Optimized):**
```bash
npm run build:android:apk:prod
```

Ya directly:
```bash
eas build --platform android --profile preview
```

### Step 5: APK Download Karo

Build complete hone ke baad:
1. Terminal mein link milega
2. Ya [expo.dev](https://expo.dev) pe login karke "Builds" section mein jao
3. APK download kar lo

---

## 🏗️ Method 2: Local Build (Advanced)

Agar aap local machine pe build karna chahte ho:

### Step 1: Android Studio Install Karo
- [Android Studio Download](https://developer.android.com/studio)
- Android SDK install karo
- Environment variables set karo:
  ```bash
  ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk
  ```

### Step 2: Prebuild Karo
```bash
npx expo prebuild --platform android
```

### Step 3: Local Build
```bash
cd android
./gradlew assembleRelease
```

APK milega: `android/app/build/outputs/apk/release/app-release.apk`

---

## ⚙️ Configuration Files

### eas.json
- `preview` profile: Testing ke liye APK
- `production` profile: Production ke liye APK
- `autoIncrement`: Version code automatically badhega

### app.json
- `package`: `com.adeel360.autofinder` (Android package name)
- `versionCode`: APK version number
- `permissions`: Camera, Location, Storage permissions

---

## 📋 Build Commands Summary

```bash
# Preview APK (Fast build)
npm run build:android:apk

# Production APK (Optimized)
npm run build:android:apk:prod

# AAB file (Play Store ke liye)
npm run build:android:aab

# Build status check
eas build:list

# Build cancel karna
eas build:cancel
```

---

## 🔧 Troubleshooting

### Error: "EAS CLI not found"
```bash
npm install -g eas-cli
```

### Error: "Not logged in"
```bash
eas login
```

### Error: "Project not configured"
```bash
eas build:configure
```

### Build fail ho raha hai?
1. Check karo ke sab dependencies install hain:
   ```bash
   npm install
   ```
2. Check karo ke `app.json` sahi hai
3. Check karo ke EAS account active hai

---

## 📦 APK Install Karne Ka Tarika

1. APK file download karo
2. Android phone pe transfer karo
3. "Unknown Sources" enable karo (Settings > Security)
4. APK file pe click karo aur install karo

---

## 🎯 Quick Start (Sabse Tez Tarika)

```bash
# 1. EAS CLI install
npm install -g eas-cli

# 2. Login
eas login

# 3. Build
cd AutoFinder-App
npm run build:android:apk

# 4. Wait karo (10-20 minutes)
# 5. Download link se APK download karo
```

---

## 📞 Support

Agar koi problem aaye to:
- EAS Build Docs: https://docs.expo.dev/build/introduction/
- Expo Discord: https://chat.expo.dev/

---

**Note**: Pehli baar build karne mein 15-20 minutes lag sakte hain. Baad mein builds fast honge.

