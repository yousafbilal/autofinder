@echo off
echo ========================================
echo AutoFinder APK Build Script
echo ========================================
echo.

REM Check if EAS CLI is installed
where eas >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] EAS CLI not found!
    echo Installing EAS CLI...
    call npm install -g eas-cli
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install EAS CLI
        pause
        exit /b 1
    )
)

echo [INFO] Checking EAS login status...
eas whoami >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Not logged in. Please login...
    call eas login
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Login failed!
        pause
        exit /b 1
    )
)

echo.
echo [INFO] Starting APK build...
echo [INFO] This may take 15-20 minutes...
echo.

REM Build APK
call eas build --platform android --profile preview

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [SUCCESS] Build completed!
    echo Check your email or expo.dev for download link
    echo ========================================
) else (
    echo.
    echo ========================================
    echo [ERROR] Build failed!
    echo Check the error messages above
    echo ========================================
)

pause

