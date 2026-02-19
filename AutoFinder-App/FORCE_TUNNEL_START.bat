@echo off
echo ========================================
echo FORCE TUNNEL MODE - COMPLETE FIX
echo ========================================
echo.
echo This will COMPLETELY force tunnel mode
echo and show you the URL to manually enter!
echo.
echo Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
echo.
echo Killing existing processes on port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 2^>nul') do (
    echo Found process %%a on port 8081, killing...
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 3 >nul
echo.
echo Clearing Expo cache...
cd /d "%~dp0"
if exist .expo rmdir /s /q .expo
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo.
echo Setting environment variables...
set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
set EXPO_NO_DOTENV=1
set EXPO_PACKAGER_PROXY_URL=http://127.0.0.1:19000
echo.
echo ========================================
echo Starting Expo with FORCED TUNNEL mode...
echo ========================================
echo.
echo IMPORTANT: After tunnel connects, you will see:
echo "Metro waiting on exp://xxx-xxx.tunnel.exp.direct:80"
echo.
echo COPY that URL and manually enter it in Expo Go app!
echo.
echo ========================================
echo.
timeout /t 2 >nul
echo.
echo ========================================
echo CRITICAL: Wait for tunnel URL before scanning!
echo ========================================
echo.
echo You will see: "Metro waiting on exp://xxx-xxx.tunnel.exp.direct:80"
echo.
echo ONLY scan QR code AFTER you see tunnel URL above!
echo.
echo ========================================
echo.
timeout /t 3 >nul
npx expo start --tunnel --clear --host tunnel --dev-client false
echo.
echo ========================================
echo If you see "exp://127.0.0.1" above, something is wrong!
echo You should see "exp://xxx-xxx.tunnel.exp.direct:80"
echo ========================================
pause
