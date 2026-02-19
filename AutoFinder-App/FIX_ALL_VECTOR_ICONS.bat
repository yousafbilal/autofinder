@echo off
echo ========================================
echo Complete Fix for @expo/vector-icons
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Killing all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo Step 2: Clearing all caches...
if exist .expo rmdir /s /q .expo
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .metro rmdir /s /q .metro

echo Step 3: Running fix-packages.js...
node fix-packages.js

echo Step 4: Verifying fixes...
echo.
echo Checking createIconSet.js...
findstr /C:"var iconProps" "node_modules\@expo\vector-icons\build\createIconSet.js" >nul
if %errorlevel% equ 0 (
    echo ✅ iconProps fix found
) else (
    echo ❌ iconProps fix missing
)

findstr /C:"constructor(props)" "node_modules\@expo\vector-icons\build\createIconSet.js" >nul
if %errorlevel% equ 0 (
    echo ✅ Constructor fix found
) else (
    echo ❌ Constructor fix missing
)

findstr /C:"var mergedResult" "node_modules\@expo\vector-icons\build\createIconSet.js" >nul
if %errorlevel% equ 0 (
    echo ✅ Spread operator fix found
) else (
    echo ❌ Spread operator fix missing
)

echo.
echo ========================================
echo Fix complete! Now restart Expo:
echo npx expo start --tunnel --clear
echo ========================================
pause
