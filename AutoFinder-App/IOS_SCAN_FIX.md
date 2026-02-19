# iOS QR Code Scan Fix - Tunnel URL in QR Code

## Problem
iOS Expo Go only has scan option, no manual entry. QR code shows `127.0.0.1` instead of tunnel URL.

## ✅ Solution: Force Tunnel URL in QR Code

### Step 1: Complete Clean Start

**Run this script:**
```
FIX_QR_CODE_TUNNEL.bat
```

This will:
- Kill all processes
- Clear all cache
- Force tunnel mode
- Make QR code show tunnel URL

### Step 2: Wait for Tunnel Connection

**Important:** Wait 30-60 seconds for tunnel to connect!

You should see in terminal:
```
Tunnel ready
Metro waiting on exp://abc-def.tunnel.exp.direct:80
```

### Step 3: Verify QR Code Shows Tunnel URL

**Before scanning, check:**

1. **Look at terminal** - it should show tunnel URL
2. **QR code in terminal** should encode tunnel URL
3. **Browser QR code** might still show localhost - IGNORE IT!

### Step 4: Scan QR Code from TERMINAL

**iOS:**
1. Open **Camera** app
2. Point at **TERMINAL QR code** (NOT browser)
3. Tap notification when it appears
4. Expo Go will open with tunnel URL

## 🔍 How to Verify QR Code is Correct

### Method 1: Check Terminal Output
Terminal should show:
```
Metro waiting on exp://abc-def.tunnel.exp.direct:80
```

NOT:
```
Metro waiting on exp://127.0.0.1:8081
```

### Method 2: Use QR Code Reader App
1. Install any QR code reader app
2. Scan QR code from terminal
3. Check if URL starts with `exp://xxx-xxx.tunnel.exp.direct`
4. If yes, use Camera app to scan same QR code

## 🆘 If QR Code Still Shows 127.0.0.1

### Option 1: Use Expo Dev Client (Recommended)
Instead of Expo Go, use development build:

```bash
cd AutoFinder-App
npx expo run:ios
```

This builds app directly on device, no QR code needed!

### Option 2: Share URL via AirDrop/Message
1. Copy tunnel URL from terminal: `exp://abc-def.tunnel.exp.direct:80`
2. Send to iPhone via AirDrop or Message
3. Tap link on iPhone
4. Expo Go will open

### Option 3: Use ngrok (Alternative Tunnel)
If Expo tunnel doesn't work:

1. **Start Expo normally:**
   ```bash
   npx expo start --clear
   ```

2. **In another terminal, install ngrok:**
   ```bash
   npm install -g ngrok
   ngrok http 8081
   ```

3. **Copy ngrok URL** (like `https://abc123.ngrok.io`)

4. **Create QR code manually:**
   - Go to: https://www.qr-code-generator.com/
   - Enter: `exp://abc123.ngrok.io`
   - Generate QR code
   - Scan with Camera app

## ✅ Success Indicators

- ✅ Terminal shows tunnel URL
- ✅ QR code in terminal encodes tunnel URL
- ✅ Camera app scans successfully
- ✅ Expo Go connects
- ✅ No `127.0.0.1` error!

## 📱 Alternative: Use Development Build

**Best solution for iOS - no QR code needed!**

```bash
cd AutoFinder-App
npx expo run:ios
```

This:
- Builds app directly on iPhone
- No QR code scanning needed
- No connection issues
- Works offline after first build
