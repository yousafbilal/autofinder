@echo off
echo Clearing cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .expo rmdir /s /q .expo
echo Cache cleared!
echo.
echo Now run: npx expo start --clear
