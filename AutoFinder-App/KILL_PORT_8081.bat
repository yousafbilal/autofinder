@echo off
echo ========================================
echo KILLING ALL NODE.JS PROCESSES
echo ========================================
echo.
echo Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ All Node.js processes killed!
) else (
    echo No Node.js processes found or already killed.
)
echo.
echo Killing processes on port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 2^>nul') do (
    echo Found process %%a on port 8081, killing...
    taskkill /F /PID %%a >nul 2>&1
)
echo.
echo Port 8081 should be free now!
timeout /t 2 >nul
echo.
echo Starting Expo...
cd /d "%~dp0"
npx expo start --lan --clear
pause

