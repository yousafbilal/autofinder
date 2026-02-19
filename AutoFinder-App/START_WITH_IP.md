# Start Expo with Specific IP: 192.168.100.6:8081

## Quick Start Command

```powershell
cd "e:\AutofinderFinallApp\AutoFinder-App"
yarn start:ip
```

Ya

```powershell
cd "e:\AutofinderFinallApp\AutoFinder-App"
npm run start:ip
```

---

## Manual Command (If Script Doesn't Work)

```powershell
cd "e:\AutofinderFinallApp\AutoFinder-App"
$env:NODE_OPTIONS="--max-old-space-size=4096"
$env:EXPO_DEVTOOLS_LISTEN_ADDRESS="192.168.100.6"
npx expo start --host 192.168.100.6 --port 8081 --clear
```

---

## Other Available Commands

### LAN Mode (Auto-detect IP):
```powershell
yarn start:lan
```

### Tunnel Mode:
```powershell
yarn start
```

### Localhost Only:
```powershell
yarn start:localhost
```

---

## Important Notes

1. **Port 8081** - Metro bundler default port
2. **IP 192.168.100.6** - Your local network IP
3. Make sure your phone/device is on the same WiFi network
4. Firewall might block port 8081 - allow it if needed

---

## If Connection Fails

1. Check firewall settings
2. Ensure phone and computer are on same WiFi
3. Try `yarn start:lan` for auto-detection
4. Check if port 8081 is already in use
