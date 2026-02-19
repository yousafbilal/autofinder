@echo off
echo ========================================
echo COMPLETE FIX - @expo/vector-icons
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Killing all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo [2/5] Clearing ALL caches...
if exist .expo rmdir /s /q .expo
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .metro rmdir /s /q .metro
if exist .expo\.cache rmdir /s /q .expo\.cache
echo Cache cleared!

echo [3/5] Running fix-packages.js...
node fix-packages.js
if %errorlevel% neq 0 (
    echo ERROR: fix-packages.js failed!
    pause
    exit /b 1
)

echo [4/5] Verifying file fixes...
set FIXED=0

findstr /C:"var iconProps" "node_modules\@expo\vector-icons\build\createIconSet.js" >nul
if %errorlevel% equ 0 (
    echo ✅ iconProps fix: OK
    set /a FIXED+=1
) else (
    echo ❌ iconProps fix: MISSING
)

findstr /C:"constructor(props)" "node_modules\@expo\vector-icons\build\createIconSet.js" >nul
if %errorlevel% equ 0 (
    echo ✅ Constructor fix: OK
    set /a FIXED+=1
) else (
    echo ❌ Constructor fix: MISSING
)

findstr /C:"var mergedResult" "node_modules\@expo\vector-icons\build\createIconSet.js" >nul
if %errorlevel% equ 0 (
    echo ✅ Spread operator fix: OK
    set /a FIXED+=1
) else (
    echo ❌ Spread operator fix: MISSING
)

echo.
echo Fixed %FIXED% out of 3 issues

echo [5/5] Ready to restart!
echo.
echo ========================================
echo Next steps:
echo 1. Run: npx expo start --tunnel --clear
echo 2. Wait for tunnel URL
echo 3. Scan QR code from TERMINAL
echo ========================================
pause
