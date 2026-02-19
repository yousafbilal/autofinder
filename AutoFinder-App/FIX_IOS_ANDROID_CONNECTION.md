# Fix: iOS & Android Connection Error - exp://127.0.0.1:8081

## 🚨 Problem
App not loading on iOS and Android phones - "Could not connect to server exp://127.0.0.1:8081"

## ✅ SOLUTION - Use This Script (Works on ALL Devices)

### Step 1: Use Force Tunnel Script
**Double-click:** `START_EXPO_FORCE_TUNNEL.bat`

This script:
- ✅ Forces tunnel mode (works everywhere)
- ✅ Kills old processes
- ✅ Sets correct environment variables
- ✅ Works on iOS, Android, any network

### Step 2: Wait for QR Code
- Wait 30-60 seconds for tunnel to connect
- QR code will appear in **TERMINAL** (not browser!)

### Step 3: Scan QR Code
- **IMPORTANT:** Scan from TERMINAL, NOT browser
- Browser shows wrong URL (127.0.0.1)
- Terminal shows correct tunnel URL

### Step 4: If Still Not Working

#### For iOS:
1. Close Expo Go app completely (swipe up)
2. Settings > Expo Go > Clear Cache
3. Run `START_EXPO_FORCE_TUNNEL.bat` again
4. Scan QR code from terminal

#### For Android:
1. Close Expo Go app completely
2. Settings > Apps > Expo Go > Storage > Clear Cache
3. Run `START_EXPO_FORCE_TUNNEL.bat` again
4. Scan QR code from terminal

## 🔧 Manual Method (If Script Doesn't Work)

```bash
cd AutoFinder-App

# Kill all Node processes
taskkill /F /IM node.exe

# Set environment and start tunnel
set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
npx expo start --tunnel --clear --host tunnel
```

## ⚠️ Common Mistakes:

1. ❌ **Scanning QR from browser** - Shows 127.0.0.1 (wrong!)
2. ✅ **Scanning QR from terminal** - Shows tunnel URL (correct!)

3. ❌ **Using LAN mode on different WiFi** - Won't work!
4. ✅ **Using Tunnel mode** - Works everywhere!

5. ❌ **Not waiting for tunnel** - Takes 30-60 seconds
6. ✅ **Wait for "Metro waiting on exp://xxx.xxx.xxx.xxx"** - Then scan!

## 🔍 Verify It's Working:

When you run the script, you should see:
```
Metro waiting on exp://xxx.xxx.xxx.xxx:80
```

NOT:
```
Metro waiting on exp://127.0.0.1:8081
```

## 📱 Alternative: Manual URL Entry

If QR code doesn't work:

1. In Expo Go app, tap "Enter URL manually"
2. Copy URL from terminal (should be like `exp://xxx.xxx.xxx.xxx:80`)
3. Paste and connect

## 🆘 Still Not Working?

1. **Check internet connection** - Tunnel needs internet
2. **Try different network** - Some networks block tunnels
3. **Use LAN mode** (if same WiFi):
   ```bash
   npx expo start --lan --clear
   ```
4. **Check firewall** - Allow Node.js through Windows Firewall
5. **Restart everything:**
   - Close Expo Go
   - Kill Node processes
   - Restart script
   - Clear Expo Go cache
   - Try again

## ✅ Success Indicators:

- ✅ Terminal shows: `exp://xxx.xxx.xxx.xxx:80` (NOT 127.0.0.1)
- ✅ QR code appears in terminal
- ✅ Expo Go connects successfully
- ✅ App loads on phone
