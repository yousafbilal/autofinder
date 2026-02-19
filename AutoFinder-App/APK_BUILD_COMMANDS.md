# 📱 AutoFinder APK Build Commands

## 🚀 Quick APK Build (Sabse Tez Tarika)

### Step 1: EAS CLI Install Karo (Agar nahi hai)
```bash
npm install -g eas-cli
```

### Step 2: AutoFinder-App Folder Mein Jao
```bash
cd AutoFinder-App
```

### Step 3: EAS Login Karo
```bash
eas login
```
Agar account nahi hai to:
```bash
eas register
```

### Step 4: APK Build Karo

**Preview APK (Testing ke liye - Fast):**
```bash
npm run build:android:apk
```

**Ya Direct Command:**
```bash
eas build --platform android --profile preview
```

**Production APK (Optimized - Play Store ke liye):**
```bash
npm run build:android:apk:prod
```

**Ya Direct Command:**
```bash
eas build --platform android --profile production
```

---

## 📋 Complete Command List

### Build Commands:
```bash
# Preview APK (Fast build, testing ke liye)
npm run build:android:apk

# Production APK (Optimized, release ke liye)
npm run build:android:apk:prod

# AAB file (Google Play Store ke liye)
npm run build:android:aab
```

### EAS Management Commands:
```bash
# Build status check karo
eas build:list

# Specific build details dekho
eas build:view [BUILD_ID]

# Build cancel karo
eas build:cancel [BUILD_ID]

# Build download karo
eas build:download [BUILD_ID]
```

### Setup Commands (Pehli Baar):
```bash
# EAS project configure karo
eas build:configure

# EAS account check karo
eas whoami

# Login karo
eas login

# Register karo (naya account)
eas register
```

---

## ⚡ Windows Batch Script (Auto)

Windows pe directly run karo:
```bash
cd AutoFinder-App
build-apk.bat
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

### Dependencies Install Karo
```bash
cd AutoFinder-App
npm install
```

---

## 📦 APK Download Kaise Kare

1. Build complete hone ke baad terminal mein **download link** milega
2. Ya [expo.dev](https://expo.dev) pe login karke **"Builds"** section mein jao
3. APK file download kar lo
4. Android phone pe transfer karo
5. "Unknown Sources" enable karo (Settings > Security)
6. APK install karo

---

## ⏱️ Build Time

- **Pehli baar**: 15-20 minutes
- **Baad mein**: 10-15 minutes
- Build cloud pe hota hai, aapka computer free rehta hai

---

## 🎯 Complete Workflow

```bash
# 1. Folder mein jao
cd AutoFinder-App

# 2. Dependencies check karo
npm install

# 3. EAS login (pehli baar)
eas login

# 4. Build start karo
npm run build:android:apk

# 5. Wait karo (15-20 minutes)
# 6. Terminal mein download link aayega
# 7. APK download karo aur install karo
```

---

**Note**: Live backend (`https://backend.autofinder.pk`) already configured hai, direct build kar sakte ho! 🚀




