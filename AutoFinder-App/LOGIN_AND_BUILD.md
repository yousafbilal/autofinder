# 🔐 Expo Login & Build Guide

## ⚠️ Security Note:
**Credentials share mat karo publicly!** Yeh sirf reference ke liye hai.

---

## 🔑 Login Steps:

### Step 1: EAS Login
```bash
eas login
```

### Step 2: Credentials Enter Karo:
- **Email:** anasiqbal0009@gmail.com
- **Password:** Bakhan101

### Step 3: Login Verify Karo:
```bash
eas whoami
```
Yeh aapka username dikhayega agar login successful ho.

---

## 🚀 Build Process:

### Step 1: Login (Agar pehle se nahi hai)
```bash
eas login
```

### Step 2: Build Start Karo
```bash
npm run build:android:apk
```

### Step 3: Wait Karo
- Build 15-20 minutes lag sakta hai
- Terminal mein progress dikhega
- Ya web dashboard check karo

---

## 📱 Build Status Check:

### Terminal Se:
```bash
eas build:list --limit 1
```

### Web Dashboard Se:
https://expo.dev/accounts/anasbakhan/projects/autofinder/builds

---

## 🔧 Agar Login Issues Aaye:

### Issue 1: "Already logged in"
```bash
eas logout
eas login
```

### Issue 2: "Invalid credentials"
- Password verify karo
- Email verify karo
- Agar forgot password ho, toh:
  ```bash
  eas login --help
  ```

### Issue 3: "Session expired"
```bash
eas logout
eas login
```

---

## ✅ Quick Checklist:

- [ ] EAS CLI installed: `eas --version`
- [ ] Login successful: `eas whoami`
- [ ] Project directory: `cd AutoFinder-App`
- [ ] Dependencies installed: `npm install`
- [ ] Build command: `npm run build:android:apk`

---

## 🆘 Help Commands:

```bash
# Login status check
eas whoami

# Logout
eas logout

# Login
eas login

# Build list
eas build:list

# Latest build status
eas build:list --limit 1
```

---

**Note:** Credentials secure rakho aur publicly share mat karo! 🔒

