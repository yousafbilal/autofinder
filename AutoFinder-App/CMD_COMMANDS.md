# CMD Commands (Windows Command Prompt)

## Clear Cache

### Option 1: Use Batch File (Easiest)
```cmd
cd "e:\AutofinderFinallApp\AutoFinder-App"
CLEAR_CACHE_CMD.bat
```

### Option 2: Manual Commands
```cmd
cd "e:\AutofinderFinallApp\AutoFinder-App"
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .expo rmdir /s /q .expo
```

## Start Expo
```cmd
cd "e:\AutofinderFinallApp\AutoFinder-App"
npx expo start --clear
```

## Full Clean Install (If Needed)
```cmd
cd "e:\AutofinderFinallApp\AutoFinder-App"
rmdir /s /q node_modules
rmdir /s /q .expo
rmdir /s /q node_modules\.cache
yarn install
npx expo start --clear
```
