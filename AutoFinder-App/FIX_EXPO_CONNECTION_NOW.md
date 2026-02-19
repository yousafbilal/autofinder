# Expo Connection Fix - Quick Guide

## Problem
Expo app showing: "Could not connect to the server" at `exp://127.0.0.1:8081`

## Solution

### Option 1: Use LAN Mode (Recommended - Same WiFi)
1. **Make sure phone and PC are on SAME WiFi network**
2. Run this command:
   ```bash
   cd AutoFinder-App
   npx expo start --lan --clear
   ```
3. **Scan the QR code** that appears in terminal (NOT the one in browser)
4. Or use the **LAN URL** shown in terminal (like `exp://192.168.x.x:8081`)

### Option 2: Use Tunnel Mode (Different Networks)
```bash
cd AutoFinder-App
npx expo start --tunnel --clear
```
Then scan the QR code shown in terminal.

### Option 3: Use Batch File (Windows)
Double-click `START_EXPO_LAN.bat` in AutoFinder-App folder

## Important Notes:
- ❌ **Don't use** `exp://127.0.0.1:8081` on physical device
- ✅ **Use LAN mode** if phone and PC on same WiFi
- ✅ **Use tunnel mode** if on different networks
- ✅ **Scan QR code from terminal**, not browser

## Troubleshooting:
1. **Kill existing processes:**
   ```bash
   # Windows
   taskkill /F /IM node.exe
   
   # Or kill port 8081
   netstat -ano | findstr :8081
   taskkill /F /PID <PID>
   ```

2. **Clear cache:**
   ```bash
   npx expo start --clear
   ```

3. **Check firewall** - allow Node.js through Windows Firewall

4. **Check WiFi** - ensure phone and PC on same network
