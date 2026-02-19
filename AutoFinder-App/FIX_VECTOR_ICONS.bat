@echo off
echo ========================================
echo Fixing @expo/vector-icons Syntax Error
echo ========================================
echo.

cd /d "%~dp0"

echo Fixing createIconSet.js...
powershell -Command "(Get-Content 'node_modules\@expo\vector-icons\build\createIconSet.js') -replace 'React\.createElement\(Text\);;', 'React.createElement(Text);' | Set-Content 'node_modules\@expo\vector-icons\build\createIconSet.js'"

echo.
echo Fixing spread operator...
powershell -Command "$content = Get-Content 'node_modules\@expo\vector-icons\build\createIconSet.js' -Raw; $content = $content -replace 'React\.createElement\(RNVIconComponent,\s*\{([^}]*?),\s*\.\.\.this\.props\s*\}\)', 'React.createElement(RNVIconComponent, Object.assign({$1}, this.props))'; Set-Content 'node_modules\@expo\vector-icons\build\createIconSet.js' -Value $content -NoNewline"

echo.
echo Running fix-packages.js...
node fix-packages.js

echo.
echo ========================================
echo Fix complete! Now restart Expo:
echo npx expo start --tunnel --clear
echo ========================================
pause
