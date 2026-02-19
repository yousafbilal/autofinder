# Fix buildLink Error

## Problem
`buildLink is not a function` error happens because of React Navigation version mismatch.

## Solution Applied:
✅ Updated package.json:
- `@react-navigation/native`: 7.1.19 → 6.1.17
- `@react-navigation/native-stack`: 7.2.1 → 6.9.26

## Now Run This (PowerShell):

```bash
npm install --legacy-peer-deps
```

This will install the correct versions.

## Then Restart:

```bash
npx expo start --clear
```

## Why This Fixes It:

- React Navigation v7 has breaking changes
- Your code uses v6 APIs
- Downgrading to v6 matches your codebase
- `buildLink` error will be fixed

After install, restart app and error should be gone!









