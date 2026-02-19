@echo off
echo ========================================
echo FORCE Killing Port 8081
echo ========================================
echo.
echo Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
echo.
echo Killing all Expo processes...
taskkill /F /IM expo.exe >nul 2>&1
echo.
echo Checking port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 2^>nul') do (
    echo Found process %%a on port 8081, killing it...
    taskkill /F /PID %%a >nul 2>&1
)
echo.
echo Killing Metro Bundler processes...
wmic process where "name='node.exe' and commandline like '%%metro%%'" delete >nul 2>&1
echo.
echo Port 8081 should be free now!
echo.
timeout /t 2 >nul
echo Starting Expo on port 8081...
cd /d "%~dp0"
npx expo start --lan --clear
pause
