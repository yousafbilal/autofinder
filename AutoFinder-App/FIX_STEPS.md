# Fix Dependency Conflict & Update Expo

## Problem:
Dependency conflict between React Navigation packages.

## Solution:

### Option 1: Fix Navigation Dependencies (RECOMMENDED)

The issue is that `@react-navigation/native-stack@7.2.1` needs `@react-navigation/native@^7.0.15`, but you have version 6.

Run these commands:

```bash
npm install @react-navigation/native@^7.1.19 --legacy-peer-deps
npm install expo@54.0.21 --legacy-peer-deps
```

### Option 2: Quick Update with Legacy Flag

If Option 1 doesn't work, just use:

```bash
npm install expo@54.0.21 --legacy-peer-deps
```

This will update Expo while ignoring peer dependency conflicts.

### Option 3: Skip Expo Update (FOR NOW)

If you just want icons to work, you can skip the Expo update for now:

```bash
# Just clear cache and restart
npx expo start --clear
```

The Expo version difference (54.0.20 vs 54.0.21) is minor and won't affect icons.

## After Update:

```bash
# Clear cache
npx expo start --clear
```

## Icons Should Work:

The icons issue is **NOT** related to Expo version. It's just a compatibility warning.

Icons should work after:
1. ✅ Package installed (@expo/vector-icons)
2. ✅ Code fixed (icon names corrected)
3. ✅ Cache cleared and app restarted

Try Option 3 first - just restart with cleared cache!









