# Memory Issue Fix Guide

## Problem
If you encounter "FATAL ERROR: Reached heap limit" or "exit code 134" errors, it means Node.js ran out of memory.

## Solution Applied
1. ✅ Created `.npmrc` file with memory limit: `4096 MB (4 GB)`
2. ✅ Added `cross-env` package for cross-platform support
3. ✅ Updated scripts to use increased memory limit

## Manual Fix (If Still Having Issues)

### Option 1: Set Environment Variable (Windows PowerShell)
```powershell
$env:NODE_OPTIONS="--max-old-space-size=4096"
yarn start
```

### Option 2: Set Environment Variable (Windows CMD)
```cmd
set NODE_OPTIONS=--max-old-space-size=4096
yarn start
```

### Option 3: Set Environment Variable Permanently (Windows)
1. Open System Properties → Environment Variables
2. Add new variable:
   - Name: `NODE_OPTIONS`
   - Value: `--max-old-space-size=4096`

### Option 4: Increase Memory Further (If 4GB is not enough)
Edit `.npmrc` file and change:
```
node-options=--max-old-space-size=8192
```
(8GB - only if you have enough RAM)

## Verify Fix
After setting the environment variable, run:
```bash
yarn start
```

The app should start without memory errors.

## Notes
- Default Node.js memory limit is ~1.5GB
- 4GB should be enough for most Expo projects
- If you have less than 8GB total RAM, don't set it higher than 4096
