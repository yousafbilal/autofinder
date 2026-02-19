@echo off
echo ========================================
echo Starting Expo with TUNNEL Mode
echo ========================================
echo.
echo This will use Expo's tunnel service
echo Works even if phone and PC are on different networks
echo.
echo Killing existing processes on port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 2^>nul') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)
echo.
echo Starting Expo with tunnel mode...
echo.
cd /d "%~dp0"
npx expo start --tunnel --clear
pause

