@echo off
echo ========================================
echo FORCE TUNNEL MODE - Works on ALL Devices
echo ========================================
echo.
echo This will force Expo to use TUNNEL mode
echo Works on iOS, Android, and any network!
echo.
echo Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
echo.
echo Killing existing processes on port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 2^>nul') do (
    echo Found process %%a on port 8081, killing...
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 >nul
echo.
echo Setting environment variables...
set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
set EXPO_NO_DOTENV=1
echo.
echo Starting Expo with FORCED TUNNEL mode...
echo.
echo ========================================
echo IMPORTANT INSTRUCTIONS:
echo ========================================
echo 1. Wait for QR code in TERMINAL (30-60 seconds)
echo 2. Scan QR code from TERMINAL, NOT browser!
echo 3. URL should start with exp://xxx.xxx.xxx.xxx
echo 4. If you see 127.0.0.1, something is wrong!
echo ========================================
echo.
cd /d "%~dp0"
echo.
echo ========================================
echo WAIT FOR TUNNEL URL (30-60 seconds)
echo ========================================
echo.
echo After tunnel connects, you will see:
echo "Metro waiting on exp://xxx-xxx.tunnel.exp.direct:80"
echo.
echo COPY that URL and manually enter it in Expo Go!
echo Do NOT scan QR code - enter URL manually!
echo ========================================
echo.
timeout /t 3 >nul
npx expo start --tunnel --clear --host tunnel
echo.
echo ========================================
echo IMPORTANT: Copy the URL above that starts with:
echo "exp://xxx-xxx.tunnel.exp.direct:80"
echo.
echo Then in Expo Go app:
echo 1. Tap "Enter URL manually"
echo 2. Paste the tunnel URL
echo 3. Tap "Connect"
echo ========================================
pause
