@echo off
echo ========================================
echo Starting Expo with TUNNEL Mode (Best for Physical Devices)
echo ========================================
echo.
echo This works even if phone and PC are on different networks!
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
echo Starting Expo with TUNNEL mode...
echo.
echo IMPORTANT: Scan QR code from TERMINAL, not browser!
echo.
cd /d "%~dp0"
set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
npx expo start --tunnel --clear --host tunnel
pause
