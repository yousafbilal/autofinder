@echo off
echo ========================================
echo FIX QR CODE - Force Tunnel URL in QR Code
echo ========================================
echo.
echo This will ensure QR code shows TUNNEL URL
echo NOT 127.0.0.1!
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
echo Clearing all Expo cache...
cd /d "%~dp0"
if exist .expo rmdir /s /q .expo
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo.
echo Setting environment to force tunnel...
set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
set EXPO_NO_DOTENV=1
set EXPO_PACKAGER_PROXY_URL=
set EXPO_USE_FAST_RESOLVER=1
echo.
echo ========================================
echo Starting Expo with TUNNEL mode...
echo ========================================
echo.
echo WAIT for tunnel to connect (30-60 seconds)
echo QR code will show tunnel URL when ready!
echo.
echo Look for: "Metro waiting on exp://xxx-xxx.tunnel.exp.direct:80"
echo.
echo ========================================
echo.
timeout /t 2 >nul
npx expo start --tunnel --clear --host tunnel --dev-client false
echo.
pause
