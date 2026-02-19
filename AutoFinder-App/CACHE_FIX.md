# 🔧 Metro Cache Error Fix

## ❌ Error
```
Error: Unable to deserialize cloned data due to invalid or unsupported version.
```

**Cause:** Corrupted Metro bundler cache

---

## ✅ Solution

### Quick Fix (Recommended)

```bash
cd AutoFinder-App
npx expo start --clear
```

**Ya phir:**

```bash
cd AutoFinder-App
npm start -- --clear
```

---

### Manual Cache Clear (If above doesn't work)

```bash
cd AutoFinder-App

# Clear Expo cache
rm -rf .expo

# Clear Metro cache
rm -rf node_modules/.cache

# Clear .metro folder (if exists)
rm -rf .metro

# Start with clean cache
npx expo start --clear
```

**Windows PowerShell:**
```powershell
cd AutoFinder-App

# Clear Expo cache
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# Clear Metro cache
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Clear .metro folder
Remove-Item -Recurse -Force .metro -ErrorAction SilentlyContinue

# Start with clean cache
npx expo start --clear
```

---

### Complete Clean (Nuclear Option)

**Agar phir bhi issue aaye:**

```bash
cd AutoFinder-App

# Remove all caches
rm -rf .expo
rm -rf node_modules/.cache
rm -rf .metro
rm -rf .expo-shared

# Reinstall dependencies
rm -rf node_modules
npm install

# Start fresh
npx expo start --clear
```

---

## 🚀 Quick Commands

### Option 1: Clear and Start
```bash
npx expo start --clear
```

### Option 2: Full Clean
```bash
rm -rf .expo node_modules/.cache .metro
npx expo start --clear
```

---

## ✅ After Fix

**Expected Output:**
```
Starting Metro Bundler
Metro waiting on exp://192.168.100.6:8081
```

**No more cache errors!** ✅

---

## 💡 Prevention

**Regularly clear cache:**
```bash
npx expo start --clear
```

**Or add to package.json:**
```json
{
  "scripts": {
    "start": "expo start --clear"
  }
}
```

---

**Try: `npx expo start --clear`** 🚀

