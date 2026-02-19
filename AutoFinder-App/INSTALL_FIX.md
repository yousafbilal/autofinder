# Fix EBUSY Error - Yarn Install

## Problem
```
error Error: EBUSY: resource busy or locked
```

## Solution

### Step 1: Close All Processes
1. **Close VS Code/Cursor** (completely exit)
2. **Close Metro bundler** (if running)
3. **Close any Node processes** in Task Manager
4. **Close any file explorers** accessing the project folder

### Step 2: Try Install Again
```bash
cd "e:\AutofinderFinallApp\AutoFinder-App"
yarn install
```

### Step 3: If Still Failing - Manual Install
```bash
# Remove node_modules and lock file
rm -rf node_modules
rm yarn.lock

# Install again
yarn install
```

### Step 4: Alternative - Use npm instead
```bash
npm install
```
