# 🔧 Expo Connection Fix - "Could not connect to the server"

## ❌ Problem
Expo Go app scan karte waqt error: **"Could not connect to the server"**  
URL: `exp://127.0.0.1:8081` (localhost - phone par kaam nahi karta)

---

## ✅ Solutions

### Solution 1: Use LAN Mode (Recommended)

**Expo server ko LAN mode mein start karo:**

```bash
cd AutoFinder-App
npx expo start --lan
```

**Ya phir:**

```bash
cd AutoFinder-App
npx expo start --host lan
```

**Expected Output:**
```
Metro waiting on exp://192.168.100.6:8081
```

**Ab QR code scan karo - yeh LAN IP use karega, localhost nahi!**

---

### Solution 2: Use Tunnel Mode (If LAN doesn't work)

**Agar same Wi-Fi par bhi issue aaye:**

```bash
cd AutoFinder-App
npx expo start --tunnel
```

**Note:** Tunnel mode slow ho sakta hai, lekin firewall issues solve karta hai.

---

### Solution 3: Kill All Processes and Restart

**Complete clean start:**

```bash
# Kill all processes on port 8081
for /f "tokens=5" %a in ('netstat -ano ^| findstr :8081') do taskkill /F /PID %a

# Clear cache and start with LAN
cd AutoFinder-App
npx expo start --lan --clear
```

---

### Solution 4: Check Network Connection

**Important Checks:**
1. ✅ Phone aur PC **same Wi-Fi network** par hona chahiye
2. ✅ Windows Firewall port 8081 ko allow kare
3. ✅ Router firewall blocking nahi kar raha

---

## 🚀 Quick Fix Commands

### Option 1: LAN Mode (Best)
```bash
cd AutoFinder-App
npx expo start --lan --clear
```

### Option 2: Tunnel Mode (If LAN fails)
```bash
cd AutoFinder-App
npx expo start --tunnel --clear
```

### Option 3: Manual IP
```bash
cd AutoFinder-App
npx expo start --host 192.168.100.6 --clear
```
(Replace `192.168.100.6` with your PC's LAN IP)

---

## 📱 How to Scan QR Code

### iOS:
1. Camera app open karo
2. QR code scan karo (jo LAN IP show kare, localhost nahi)
3. Expo Go app automatically open hoga

### Android:
1. Expo Go app open karo
2. "Scan QR code" option select karo
3. QR code scan karo

---

## ✅ Expected Output (Success)

**Terminal mein yeh dikhega:**
```
Starting Metro Bundler
Metro waiting on exp://192.168.100.6:8081  ← LAN IP (not localhost)
› Scan the QR code above with Expo Go
```

**Phone par:**
- QR code scan karo
- App successfully load hoga
- No connection errors!

---

## 🔍 Troubleshooting

### Issue 1: Still shows localhost
**Fix:** Use `--lan` flag
```bash
npx expo start --lan
```

### Issue 2: Firewall blocking
**Fix:** Use tunnel mode
```bash
npx expo start --tunnel
```

### Issue 3: Different networks
**Fix:** Use tunnel mode OR connect to same Wi-Fi

---

## 💡 Prevention

**Always use LAN mode:**
```bash
npx expo start --lan
```

**Or update package.json:**
```json
{
  "scripts": {
    "start": "expo start --lan"
  }
}
```

---

**Try: `npx expo start --lan --clear`** 🚀

