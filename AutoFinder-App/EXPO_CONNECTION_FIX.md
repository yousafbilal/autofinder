# 🔧 Expo Connection Fix - "Could not connect to the server"

## ❌ Problem
Expo Go app scan karte waqt error: **"Could not connect to the server"**  
URL: `exp://127.0.0.1:8081`

---

## ✅ Solutions

### Solution 1: Start Expo Development Server

**Terminal mein yeh command run karo:**

```bash
cd AutoFinder-App
npm start
```

Ya phir:

```bash
cd AutoFinder-App
npx expo start
```

**Expected Output:**
```
› Metro waiting on exp://192.168.100.6:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

---

### Solution 2: Check Network Connection

**Agar server chal raha hai phir bhi error aaye:**

1. **Same Wi-Fi network check karo:**
   - Phone aur PC dono same Wi-Fi par hona chahiye
   - Different networks par nahi chalega

2. **Firewall check karo:**
   - Windows Firewall Expo ko block kar raha ho sakta hai
   - Port 8081 allow karo

3. **LAN IP check karo:**
   - Expo server jo IP show kare (e.g., `192.168.100.6`)
   - Woh IP use karo, `127.0.0.1` nahi

---

### Solution 3: Use Tunnel Mode (If LAN doesn't work)

**Expo tunnel use karo:**

```bash
cd AutoFinder-App
npx expo start --tunnel
```

**Note:** Tunnel mode slow ho sakta hai, lekin firewall issues solve karta hai.

---

### Solution 4: Clear Expo Cache

**Agar phir bhi issue aaye:**

```bash
cd AutoFinder-App
npx expo start --clear
```

---

### Solution 5: Check Backend Server

**Backend server bhi chal raha hona chahiye:**

```bash
# Backend folder mein
cd autofinder-backend-orignal-
node index.js
```

**Backend URL:** `http://192.168.100.6:8001` (config.js mein set hai)

---

## 🔍 Quick Checklist

- [ ] Expo server running? (`npm start`)
- [ ] Backend server running? (`node index.js`)
- [ ] Phone aur PC same Wi-Fi par?
- [ ] Firewall blocking nahi?
- [ ] Correct IP use ho raha hai? (192.168.100.6, not 127.0.0.1)

---

## 📱 How to Scan QR Code

### iOS:
1. Camera app open karo
2. QR code scan karo
3. Expo Go app automatically open hoga

### Android:
1. Expo Go app open karo
2. "Scan QR code" option select karo
3. QR code scan karo

---

## 🚀 Quick Start Commands

```bash
# Terminal 1: Start Expo
cd AutoFinder-App
npm start

# Terminal 2: Start Backend (if not running)
cd autofinder-backend-orignal-
node index.js
```

---

## ⚠️ Common Issues

### Issue 1: "Metro bundler failed to start"
**Fix:** Port already in use
```bash
# Kill process on port 8081
npx kill-port 8081
npm start
```

### Issue 2: "Network request failed"
**Fix:** Backend server nahi chal raha
```bash
# Start backend
cd autofinder-backend-orignal-
node index.js
```

### Issue 3: "Cannot connect to Expo"
**Fix:** Use tunnel mode
```bash
npx expo start --tunnel
```

---

**Try Solution 1 first!** 🚀

