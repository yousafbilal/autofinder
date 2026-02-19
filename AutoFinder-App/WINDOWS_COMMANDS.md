# Windows Commands - Cache Clear Karne Ke Liye

## PowerShell Commands (Recommended)

### Step 1: Fix Script Run Karo
```powershell
cd "e:\AutofinderFinallApp\AutoFinder-App"
node fix-vector-icons.js
```

### Step 2: Cache Clear Karo (PowerShell)
```powershell
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
```

### Step 3: App Start Karo
```powershell
npx expo start --clear
```

---

## CMD Commands (Alternative)

### Step 1: Fix Script Run Karo
```cmd
cd "e:\AutofinderFinallApp\AutoFinder-App"
node fix-vector-icons.js
```

### Step 2: Cache Clear Karo (CMD)
```cmd
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .expo rmdir /s /q .expo
```

### Step 3: App Start Karo
```cmd
npx expo start --clear
```

---

## One-Line Commands (Easier)

### PowerShell One-Line:
```powershell
cd "e:\AutofinderFinallApp\AutoFinder-App"; node fix-vector-icons.js; Remove-Item -Recurse -Force node_modules\.cache,.expo -ErrorAction SilentlyContinue; npx expo start --clear
```

### CMD One-Line:
```cmd
cd "e:\AutofinderFinallApp\AutoFinder-App" && node fix-vector-icons.js && (if exist node_modules\.cache rmdir /s /q node_modules\.cache) && (if exist .expo rmdir /s /q .expo) && npx expo start --clear
```
