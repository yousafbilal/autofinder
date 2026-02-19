# AutoFinder APK Build Script (Auto Answer)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AutoFinder APK Build - Auto Mode" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if EAS CLI is installed
if (-not (Get-Command eas -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] EAS CLI not found! Installing..." -ForegroundColor Red
    npm install -g eas-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install EAS CLI" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[INFO] Starting APK build..." -ForegroundColor Yellow
Write-Host "[INFO] This will automatically create EAS project if needed" -ForegroundColor Yellow
Write-Host "[INFO] Build may take 15-20 minutes..." -ForegroundColor Yellow
Write-Host ""

# Run build with auto-answer
$input = "Y" | eas build --platform android --profile preview

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "[SUCCESS] Build completed!" -ForegroundColor Green
    Write-Host "Check your email or expo.dev for download link" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "[ERROR] Build failed!" -ForegroundColor Red
    Write-Host "Check the error messages above" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

