#!/bin/bash

echo "========================================"
echo "AutoFinder APK Build Script"
echo "========================================"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "[ERROR] EAS CLI not found!"
    echo "Installing EAS CLI..."
    npm install -g eas-cli
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install EAS CLI"
        exit 1
    fi
fi

# Check login status
echo "[INFO] Checking EAS login status..."
eas whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "[INFO] Not logged in. Please login..."
    eas login
    if [ $? -ne 0 ]; then
        echo "[ERROR] Login failed!"
        exit 1
    fi
fi

echo ""
echo "[INFO] Starting APK build..."
echo "[INFO] This may take 15-20 minutes..."
echo ""

# Build APK
eas build --platform android --profile preview

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "[SUCCESS] Build completed!"
    echo "Check your email or expo.dev for download link"
    echo "========================================"
else
    echo ""
    echo "========================================"
    echo "[ERROR] Build failed!"
    echo "Check the error messages above"
    echo "========================================"
    exit 1
fi

