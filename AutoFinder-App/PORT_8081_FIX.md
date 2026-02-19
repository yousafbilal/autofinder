# 🔧 Port 8081 Already in Use - Fix

## ❌ Error
```
Error: listen EADDRINUSE: address already in use :::8081
```

**Cause:** Port 8081 already use ho raha hai (pehle se Expo server chal raha hai)

---

## ✅ Solution

### Quick Fix (Recommended)

**Step 1: Find Process Using Port 8081**
```bash
netstat -ano | findstr :8081
```

**Step 2: Kill the Process**
```bash
taskkill /F /PID [PROCESS_ID]
```

**Example:**
```bash
taskkill /F /PID 14404
```

---

### Alternative: Use Different Port

**Agar process kill nahi karna chahte:**

```bash
npx expo start --port 8082
```

Ya phir:

```bash
npx expo start --port 19000
```

---

### Complete Fix Script

**Windows PowerShell:**
```powershell
# Find process on port 8081
$port = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
if ($port) {
    $pid = $port.OwningProcess
    Write-Host "Killing process $pid on port 8081"
    Stop-Process -Id $pid -Force
    Start-Sleep -Seconds 2
}

# Start Expo
npx expo start --clear
```

---

## 🚀 Quick Commands

### Option 1: Kill and Restart
```bash
# Find process
netstat -ano | findstr :8081

# Kill process (replace PID with actual process ID)
taskkill /F /PID [PID]

# Start Expo
npx expo start --clear
```

### Option 2: Use Different Port
```bash
npx expo start --port 8082 --clear
```

---

## ✅ After Fix

**Expected Output:**
```
Starting Metro Bundler
Metro waiting on exp://192.168.100.6:8081
```

**No more port errors!** ✅

---

## 💡 Prevention

**Always stop Expo server properly:**
- Press `Ctrl+C` in terminal to stop server
- Don't close terminal without stopping

**Or use:**
```bash
npx kill-port 8081
npx expo start
```

---

**Process kill ho gaya hai. Ab `npx expo start --clear` run karo!** 🚀

