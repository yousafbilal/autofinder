# iOS Alternative Methods - No Manual Entry Needed

## Method 1: Share URL via AirDrop/Message (Easiest)

### Step 1: Get Tunnel URL
Run: `FIX_QR_CODE_TUNNEL.bat`

Wait for tunnel URL in terminal:
```
exp://abc-def.tunnel.exp.direct:80
```

### Step 2: Copy URL
Copy the tunnel URL from terminal

### Step 3: Send to iPhone
**Option A - AirDrop:**
1. On PC, right-click > New > Text Document
2. Paste tunnel URL
3. Right-click file > Share > AirDrop
4. Select iPhone
5. On iPhone, tap "Accept"
6. Tap the link
7. Expo Go opens automatically

**Option B - Email/Message:**
1. Email yourself the tunnel URL
2. Open email on iPhone
3. Tap the link
4. Expo Go opens automatically

## Method 2: Use Development Build (Best Solution)

**No QR code needed at all!**

```bash
cd AutoFinder-App
npx expo run:ios
```

This:
- ✅ Builds app directly on iPhone
- ✅ No QR code scanning
- ✅ No connection issues
- ✅ Works offline after first build
- ✅ Faster development

**Requirements:**
- Mac with Xcode (for iOS)
- iPhone connected via USB
- Apple Developer account (free)

## Method 3: Use ngrok + Manual QR Code

### Step 1: Start Expo
```bash
cd AutoFinder-App
npx expo start --clear
```

### Step 2: Install ngrok
```bash
npm install -g ngrok
```

### Step 3: Tunnel Port 8081
```bash
ngrok http 8081
```

### Step 4: Copy ngrok URL
Copy URL like: `https://abc123.ngrok.io`

### Step 5: Create QR Code
1. Go to: https://www.qr-code-generator.com/
2. Enter: `exp://abc123.ngrok.io`
3. Generate QR code
4. Scan with Camera app

## Method 4: Use Expo Go Web Version

1. Open Safari on iPhone
2. Go to: `exp://192.168.x.x:8081` (your PC's LAN IP)
3. Safari will ask to open in Expo Go
4. Tap "Open"

**To find your PC's LAN IP:**
```bash
ipconfig
```
Look for IPv4 Address (like 192.168.1.100)

## Method 5: Use Expo Dev Tools

1. Start Expo: `npx expo start --tunnel`
2. Open browser: http://localhost:19002
3. Click "Share" button
4. Copy shareable link
5. Send to iPhone via AirDrop/Message
6. Tap link on iPhone

## ✅ Recommended: Development Build

**For iOS, development build is best:**

```bash
cd AutoFinder-App
npx expo run:ios
```

**Benefits:**
- No QR code issues
- No connection problems
- Faster reload
- Works offline
- Better debugging

**Setup:**
1. Install Xcode from App Store
2. Connect iPhone via USB
3. Trust computer on iPhone
4. Run: `npx expo run:ios`
5. App installs directly on iPhone!
