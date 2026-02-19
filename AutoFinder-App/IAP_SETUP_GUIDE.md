# 🍎 Apple In-App Purchase Setup Guide

## ❌ Common Error: "Failed to connect to App Store"

Yeh error kuch reasons se aa sakta hai:
1. Product ID App Store Connect mein configured nahi hai
2. App Store Connect mein product active nahi hai
3. Bundle ID mismatch
4. Network/connectivity issue
5. Sandbox account setup nahi hai

---

## ✅ Step-by-Step Setup

### 1. App Store Connect Configuration

#### A. Product ID Setup

1. **App Store Connect** mein jao: https://appstoreconnect.apple.com
2. **My Apps** → Apni app select karo
3. **Features** tab → **In-App Purchases** → **+** button
4. **Auto-Renewable Subscription** select karo
5. **Product ID:** `dealer_monthly_ios` (exact match required)
6. **Reference Name:** "Dealer Package Monthly"
7. **Subscription Group:** Create new group ya existing use karo
8. **Subscription Duration:** 1 Month (ya jo bhi duration chahiye)
9. **Price:** Set karo (e.g., $9.99/month)
10. **Save** karo

#### B. Product Status

**Important:** Product ko **"Ready to Submit"** status mein hona chahiye:
- ✅ Product details complete
- ✅ Pricing set
- ✅ Subscription group configured
- ✅ App submission ready

**Status check:**
- App Store Connect → Features → In-App Purchases
- Product status: **"Ready to Submit"** hona chahiye

---

### 2. Bundle ID Verification

**Check karo ke Bundle ID match kar raha hai:**

1. **Xcode** mein:
   - Project → Target → General → Bundle Identifier
   - Example: `com.autofinder.app`

2. **App Store Connect** mein:
   - My Apps → App Information → Bundle ID
   - Same Bundle ID hona chahiye

3. **app.json** mein:
   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.autofinder.app"
       }
     }
   }
   ```

---

### 3. Provisioning Profile

**Important:** EAS build ke liye correct provisioning profile:

1. **EAS** automatically handle karta hai
2. **App Store Connect** mein app create karo pehle
3. **Certificates** automatically generate honge

**Check:**
```bash
eas credentials
```

---

### 4. Sandbox Testing Account

**Test karne ke liye Sandbox account:**

1. **App Store Connect** → **Users and Access** → **Sandbox Testers**
2. **+** button → Test account create karo
3. **Email:** test@example.com (real email nahi chahiye)
4. **Password:** Set karo
5. **Country/Region:** Select karo

**Test karne ke liye:**
- Device par **Settings** → **App Store** → **Sandbox Account** → Login karo
- Ya phir purchase karte waqt Sandbox account se login karo

---

### 5. Product ID Verification

**Code mein Product ID check karo:**

**File:** `AutoFinder-App/src/services/iapService.ts`
```typescript
const DEALER_PACKAGE_PRODUCT_ID = 'dealer_monthly_ios';
```

**App Store Connect mein bhi same Product ID hona chahiye!**

---

## 🔍 Troubleshooting

### Error: "Failed to connect to App Store"

**Solutions:**

1. **Check Internet Connection:**
   - Wi-Fi ya cellular data ON hai?
   - App Store accessible hai?

2. **Check Product ID:**
   - App Store Connect mein product exist karta hai?
   - Product ID exact match: `dealer_monthly_ios`
   - Product status: "Ready to Submit"

3. **Check Bundle ID:**
   - Xcode, App Store Connect, aur app.json mein same Bundle ID

4. **Check App Status:**
   - App Store Connect mein app "Ready for Submission" status mein hai?
   - In-App Purchase product "Ready to Submit" status mein hai?

5. **Test with Sandbox Account:**
   - Sandbox tester account se login karo
   - Purchase flow test karo

6. **Check Logs:**
   - Xcode Console mein detailed logs dekho
   - Error messages check karo

---

### Error: "Product not found in App Store"

**Solutions:**

1. **Product ID mismatch:**
   - Code: `dealer_monthly_ios`
   - App Store Connect: Same Product ID hona chahiye

2. **Product not active:**
   - App Store Connect → Features → In-App Purchases
   - Product status check karo
   - "Ready to Submit" hona chahiye

3. **App not submitted:**
   - App Store Connect mein app submit karo (TestFlight ya App Store)
   - In-App Purchase product bhi submit karo

---

### Error: "Connection timeout"

**Solutions:**

1. **Retry logic:**
   - Code mein automatic retry hai (2 attempts)
   - Wait karo aur phir try karo

2. **Network issues:**
   - Internet connection check karo
   - VPN off karo (agar ON hai)

3. **App Store servers:**
   - Apple servers down ho sakte hain
   - Thoda wait karo aur phir try karo

---

## 📱 Testing Checklist

### Before Testing:

- [ ] App Store Connect mein product configured hai
- [ ] Product ID: `dealer_monthly_ios` (exact match)
- [ ] Product status: "Ready to Submit"
- [ ] Bundle ID match kar raha hai
- [ ] Sandbox tester account create kiya hai
- [ ] EAS build successfully complete hua hai

### During Testing:

- [ ] Device par Sandbox account login kiya hai
- [ ] Internet connection active hai
- [ ] App Store accessible hai
- [ ] Purchase flow start ho raha hai
- [ ] Apple IAP sheet open ho raha hai
- [ ] Purchase complete ho raha hai
- [ ] Receipt backend ko send ho raha hai
- [ ] Backend verification successful hai

---

## 🚀 Quick Fix Commands

### 1. Check Product ID in Code:
```bash
grep -r "dealer_monthly_ios" AutoFinder-App/src/
```

### 2. Verify Bundle ID:
```bash
grep -r "bundleIdentifier" AutoFinder-App/app.json
```

### 3. Check IAP Service:
```bash
cat AutoFinder-App/src/services/iapService.ts | grep "DEALER_PACKAGE_PRODUCT_ID"
```

---

## 📋 Important Notes

1. **Product ID must match exactly:**
   - Code: `dealer_monthly_ios`
   - App Store Connect: `dealer_monthly_ios`
   - Case-sensitive hai!

2. **Product must be active:**
   - "Ready to Submit" status hona chahiye
   - App submission ke saath submit karo

3. **Sandbox testing:**
   - Real payment nahi hoga
   - Test account se purchase karo

4. **Production testing:**
   - App Store submission ke baad
   - Real payment hoga

---

## 🎯 Next Steps

1. **App Store Connect** mein product verify karo
2. **Product ID** exact match karo
3. **EAS build** create karo
4. **Sandbox account** se test karo
5. **Logs** check karo agar issue aaye

---

**Main Fix:** Product ID App Store Connect mein properly configured hona chahiye aur "Ready to Submit" status mein hona chahiye! 🚀

