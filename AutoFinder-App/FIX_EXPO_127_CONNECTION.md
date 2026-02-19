# Fix: Expo Connection Error - exp://127.0.0.1:8081

## Problem
Expo Go app showing: "Could not connect to the server" at `exp://127.0.0.1:8081`

## Root Cause
Expo is trying to connect to `127.0.0.1` (localhost) which doesn't work on physical devices. You need to use LAN IP or Tunnel mode.

## ✅ Solution 1: Use Tunnel Mode (RECOMMENDED - Works Everywhere)

**Best option for physical devices!**

1. **Double-click:** `START_EXPO_TUNNEL_FIXED.bat`
   
   OR manually run:
   ```bash
   cd AutoFinder-App
   npx expo start --tunnel --clear
   ```

2. **Wait for QR code** in terminal (may take 30-60 seconds)

3. **Scan QR code from TERMINAL** (NOT browser!)

4. **Done!** Works even if phone and PC are on different WiFi networks

## ✅ Solution 2: Use LAN Mode (Same WiFi Required)

**Only works if phone and PC are on SAME WiFi network**

1. **Make sure phone and PC are on SAME WiFi**

2. **Double-click:** `START_EXPO_LAN.bat`
   
   OR manually run:
   ```bash
   cd AutoFinder-App
   npx expo start --lan --clear
   ```

3. **Scan QR code from TERMINAL** (NOT browser!)

4. Look for URL like `exp://192.168.x.x:8081` in terminal

## ✅ Solution 3: Manual Fix (If Above Don't Work)

1. **Kill all Node processes:**
   ```bash
   taskkill /F /IM node.exe
   ```

2. **Clear Expo cache:**
   ```bash
   cd AutoFinder-App
   npx expo start --clear --tunnel
   ```

3. **In Expo Go app:**
   - Go to "Enter URL manually"
   - Enter the URL from terminal (should be like `exp://192.168.x.x:8081` or `exp://xxx.xxx.xxx.xxx`)
   - NOT `exp://127.0.0.1:8081`

## ⚠️ Important Notes:

1. **NEVER scan QR code from browser** - it shows `127.0.0.1` which won't work
2. **ALWAYS scan QR code from terminal** - it shows correct LAN/Tunnel IP
3. **Tunnel mode is slower** but works everywhere
4. **LAN mode is faster** but requires same WiFi

## 🔧 Troubleshooting:

### If still getting 127.0.0.1:
1. Close Expo Go app completely
2. Clear Expo Go app cache (Android: Settings > Apps > Expo Go > Clear Cache)
3. Restart Expo server with tunnel mode
4. Scan QR code again from terminal

### If connection times out:
1. Check firewall - allow Node.js through Windows Firewall
2. Try tunnel mode instead of LAN mode
3. Check if port 8081 is blocked by antivirus

### If QR code doesn't appear:
1. Check terminal output - look for "Metro waiting on..."
2. Try `npx expo start --tunnel --clear` manually
3. Check internet connection (tunnel mode needs internet)

## Quick Commands:

```bash
# Tunnel mode (best for physical devices)
cd AutoFinder-App
npx expo start --tunnel --clear

# LAN mode (same WiFi only)
cd AutoFinder-App
npx expo start --lan --clear

# Kill all Node processes
taskkill /F /IM node.exe
```
