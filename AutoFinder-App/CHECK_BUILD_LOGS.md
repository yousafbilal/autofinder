# 📋 Build Logs Check Karne Ka Tarika

## 🚀 Quick Methods:

### Method 1: Terminal Se Direct (Sabse Aasan)

Build start karne ke baad, terminal mein automatically logs dikhenge:

```bash
npm run build:android:apk
```

Terminal mein aap dekh sakte ho:
- Build status (in progress, completed, failed)
- Build ID
- Build URL
- Real-time logs

---

### Method 2: Build List Check Karna

Sabhi builds ki list dekhne ke liye:

```bash
eas build:list
```

Yeh command dikhayega:
- Build ID
- Platform (Android/iOS)
- Status (in-progress, finished, errored)
- Created date
- Build profile

---

### Method 3: Specific Build Ka Log Dekhna

Agar aapko specific build ka log chahiye:

```bash
# Build ID se log dekho
eas build:view <BUILD_ID>
```

**Example:**
```bash
eas build:view 6ad6d36b-e1fc-4fdc-871e-747eea3ae187
```

**Note:** Build ID terminal mein build start hone ke baad dikhega.

---

### Method 4: Web Dashboard Se (Sabse Detailed)

1. **Expo.dev pe login karo:**
   - https://expo.dev pe jao
   - Apne account se login karo

2. **Builds section mein jao:**
   - Dashboard pe "Builds" tab pe click karo
   - Ya direct: https://expo.dev/accounts/[YOUR_USERNAME]/projects/autofinder/builds

3. **Build select karo:**
   - Jo build check karna hai, uspe click karo
   - Detailed logs dikhenge

4. **Logs sections:**
   - **Install dependencies** - npm install logs
   - **Bundle JavaScript** - JavaScript bundling logs
   - **Run gradlew** - Android build logs
   - **Upload artifacts** - Upload logs

---

### Method 5: Build Status Check (Real-time)

Build chal raha hai aur aap status check karna chahte ho:

```bash
# Latest build ka status
eas build:list --limit 1

# Ya specific build ID se
eas build:view <BUILD_ID>
```

---

## 🔍 Logs Mein Kya Dekhna Hai:

### ✅ Success Indicators:
- `✓ Build finished`
- `✓ Build artifacts uploaded`
- `Download URL: https://...`

### ❌ Error Indicators:
- `× Build failed`
- `Error: ...`
- `Failed at phase: ...`

### 📊 Common Error Phases:

1. **"Bundle JavaScript" phase fail:**
   - TypeScript errors
   - Missing imports
   - Syntax errors

2. **"Run gradlew" phase fail:**
   - Android build errors
   - Gradle configuration issues
   - Missing dependencies

3. **"Install dependencies" phase fail:**
   - npm install errors
   - Package conflicts

---

## 🛠️ Detailed Logs Kaise Dekhe:

### Terminal Se Full Logs:

```bash
# Verbose mode (detailed logs)
eas build --platform android --profile preview --verbose

# Ya JSON format mein
eas build:view <BUILD_ID> --json
```

### Web Dashboard Se:

1. Build page pe jao
2. "View logs" button pe click karo
3. Har phase ka detailed log dikhega
4. Errors highlight honge

---

## 📱 Build Logs Ka Structure:

```
Build Started
├── Install dependencies
│   ├── npm install
│   └── Dependencies installed
├── Bundle JavaScript
│   ├── Metro bundler
│   ├── TypeScript check (if enabled)
│   └── JavaScript bundle created
├── Run gradlew
│   ├── Android build
│   ├── APK generation
│   └── Signing
└── Upload artifacts
    ├── APK upload
    └── Build complete
```

---

## 🆘 Agar Build Fail Ho:

### Step 1: Error Message Read Karo
Terminal ya web dashboard se error message copy karo.

### Step 2: Error Phase Identify Karo
- Konse phase mein fail hua?
- "Bundle JavaScript" = Code issue
- "Run gradlew" = Android build issue

### Step 3: Logs Check Karo
```bash
eas build:view <BUILD_ID>
```

### Step 4: Common Fixes:

**JavaScript Bundle Error:**
- TypeScript errors fix karo
- Missing imports add karo
- Syntax errors check karo

**Gradle Error:**
- `app.json` check karo
- Permissions verify karo
- Android config check karo

---

## 💡 Pro Tips:

1. **Build start karne se pehle:**
   ```bash
   # Local test karo
   npm start
   ```

2. **Build logs save karo:**
   ```bash
   eas build:view <BUILD_ID> > build-log.txt
   ```

3. **Real-time monitoring:**
   - Terminal open rakho
   - Ya web dashboard refresh karte raho

4. **Build cancel karna:**
   ```bash
   eas build:cancel <BUILD_ID>
   ```

---

## 📞 Quick Commands Summary:

```bash
# Build start karo
npm run build:android:apk

# Build list dekho
eas build:list

# Specific build log dekho
eas build:view <BUILD_ID>

# Latest build status
eas build:list --limit 1

# Build cancel karo
eas build:cancel <BUILD_ID>
```

---

## 🌐 Web Links:

- **Expo Dashboard:** https://expo.dev
- **Builds Page:** https://expo.dev/accounts/[USERNAME]/projects/autofinder/builds
- **EAS Docs:** https://docs.expo.dev/build/introduction/

---

**Note:** Build logs real-time update hote hain. Terminal ya web dashboard dono mein same logs dikhenge.

