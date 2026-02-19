# Clear Expo Go Cache - iOS & Android

## Why Clear Cache?
Expo Go app caches the connection URL. If it cached `127.0.0.1`, it will keep trying that even after you start tunnel mode.

## iOS - Clear Cache

### Method 1: Settings
1. Open **Settings** app
2. Scroll down to **Expo Go**
3. Tap **Expo Go**
4. Tap **Clear Cache** or **Reset**

### Method 2: Reinstall
1. Long press Expo Go app icon
2. Tap **Remove App** or **Delete**
3. Go to App Store
4. Reinstall **Expo Go**

## Android - Clear Cache

### Method 1: Settings
1. Open **Settings** app
2. Go to **Apps** or **Application Manager**
3. Find **Expo Go**
4. Tap **Expo Go**
5. Tap **Storage**
6. Tap **Clear Cache**
7. (Optional) Tap **Clear Data** for complete reset

### Method 2: Reinstall
1. Long press Expo Go app icon
2. Tap **Uninstall**
3. Go to Play Store
4. Reinstall **Expo Go**

## After Clearing Cache

1. **Close Expo Go completely**
2. **Start tunnel mode:**
   ```bash
   cd AutoFinder-App
   npx expo start --tunnel --clear --host tunnel
   ```
3. **Wait for tunnel URL** (30-60 seconds)
4. **In Expo Go, enter URL manually** (don't scan QR)
5. **Paste tunnel URL** and connect

## Verify It's Cleared

After clearing cache:
- Expo Go should show fresh start screen
- No previous projects cached
- Can enter new URL manually
