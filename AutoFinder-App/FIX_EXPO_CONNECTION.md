# 🔧 Expo Connection Fix - Complete Solution

## ❌ Current Problem
- Phone scan karte waqt: **"Could not connect to the server"**
- URL showing: `exp://127.0.0.1:8081` (localhost - phone par kaam nahi karta)

---

## ✅ Solution: Use TUNNEL Mode

**Tunnel mode sabse reliable hai - yeh hamesha kaam karta hai!**

### Step 1: Kill All Processes

**Terminal/PowerShell mein:**
```bash
# Kill all Node processes
taskkill /F /IM node.exe
```

Ya phir:
```bash
# Kill processes on port 8081
for /f "tokens=5" %a in ('netstat -ano ^| findstr :8081') do taskkill /F /PID %a
```

### Step 2: Start Expo with TUNNEL Mode

**Terminal mein:**
```bash
cd AutoFinder-App
npx expo start --tunnel --clear
```

**Ya phir batch file use karo:**
- `START_EXPO_TUNNEL.bat` file double-click karo
- Automatically tunnel mode start hoga

---

## 📱 Expected Output

**Terminal mein yeh dikhega:**
```
Starting Metro Bundler
Tunnel ready
Metro waiting on exp://xxx-xxx.tunnel.exp.direct:80
› Scan the QR code above with Expo Go
```

**Important:** QR code mein tunnel URL dikhega (e.g., `exp://xxx-xxx.tunnel.exp.direct:80`), localhost nahi!

---

## 🚀 Quick Commands

### Option 1: Tunnel Mode (Best - Always Works)
```bash
cd AutoFinder-App
npx expo start --tunnel --clear
```

### Option 2: LAN Mode (If same Wi-Fi)
```bash
cd AutoFinder-App
npx expo start --lan --clear
```

### Option 3: Use Batch File
- `START_EXPO_TUNNEL.bat` double-click karo

---

## 🔍 Why Tunnel Mode?

**Tunnel Mode Benefits:**
- ✅ Works on different networks (phone aur PC alag Wi-Fi par bhi)
- ✅ Firewall issues solve karta hai
- ✅ Most reliable connection
- ✅ QR code scan karo aur kaam karta hai

**Note:** Tunnel mode thoda slow ho sakta hai, lekin hamesha kaam karta hai!

---

## 📋 Step-by-Step Instructions

1. **Kill all processes:**
   ```bash
   taskkill /F /IM node.exe
   ```

2. **Start Expo with tunnel:**
   ```bash
   cd AutoFinder-App
   npx expo start --tunnel --clear
   ```

3. **Wait for QR code:**
   - Terminal mein tunnel URL dikhega
   - QR code generate hoga

4. **Scan QR code:**
   - iOS: Camera app se scan karo
   - Android: Expo Go app se scan karo

5. **App load hoga!** ✅

---

## ⚠️ Important Notes

1. **Tunnel mode slow ho sakta hai** - patience rakho
2. **First time tunnel setup** - thoda time lagega
3. **QR code scan karo** - tunnel URL wala, localhost wala nahi

---

## 🎯 Alternative: Update package.json

**Agar hamesha tunnel mode use karna ho:**

`package.json` mein:
```json
{
  "scripts": {
    "start": "expo start --tunnel"
  }
}
```

Phir bas `npm start` run karo!

---

**Try: `npx expo start --tunnel --clear`** 🚀

