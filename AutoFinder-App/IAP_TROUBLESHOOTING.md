# 🔧 IAP Troubleshooting: "Failed to connect to App Store"

## ❌ Error: "Failed to connect to App Store"

Yeh error **App Store Connect configuration** issue hai, **internet connection nahi**.

---

## ✅ Step-by-Step Fix

### 1. **App Store Connect - Product ID Check** (MOST IMPORTANT)

**Product ID EXACT match hona chahiye:**

1. **App Store Connect** mein jao: https://appstoreconnect.apple.com
2. **My Apps** → Apni app select karo
3. **Features** → **In-App Purchases** → Check karo
4. **Product ID:** `dealer_monthly_ios` (exact match)
5. **Status:** "Ready to Submit" hona chahiye

**❌ Agar product nahi hai:**
- **+** button click karo
- **Auto-Renewable Subscription** select karo
- **Product ID:** `dealer_monthly_ios` (exact)
- **Save** karo

---

### 2. **Bundle ID Verification**

**Check karo ke Bundle ID match kar raha hai:**

**Xcode mein:**
- Project → Target → General → Bundle Identifier
- Example: `com.autofinder.app`

**App Store Connect mein:**
- My Apps → App Information → Bundle ID
- **Same Bundle ID** hona chahiye

**app.json mein:**
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.autofinder.app"
    }
  }
}
```

**❌ Agar mismatch hai:**
- App Store Connect mein app ka Bundle ID check karo
- `app.json` mein same Bundle ID set karo
- EAS build phir se create karo

---

### 3. **App Status Check**

**App Store Connect mein:**

1. **My Apps** → Apni app
2. **App Status** check karo:
   - ✅ "Ready for Submission" ya "In Review" hona chahiye
   - ❌ "Prepare for Submission" status mein hai to app submit karo

3. **In-App Purchase Status:**
   - ✅ "Ready to Submit" hona chahiye
   - ❌ "Missing Metadata" ya "Waiting for Review" status mein hai to complete karo

---

### 4. **EAS Build Verification**

**Check karo ke EAS build properly create hua hai:**

```bash
cd AutoFinder-App
eas build:list --platform ios
```

**Latest build check karo:**
- ✅ Build status: "finished"
- ✅ Build type: "preview" ya "production"
- ✅ Bundle ID correct hai

**❌ Agar build issue hai:**
```bash
npm run build:ios
```

---

### 5. **Sandbox Testing Account**

**Test karne ke liye Sandbox account:**

1. **App Store Connect** → **Users and Access** → **Sandbox Testers**
2. **+** button → Test account create karo
3. **Email:** test@example.com (real email nahi chahiye)
4. **Password:** Set karo
5. **Country/Region:** Select karo

**Device par:**
- **Settings** → **App Store** → **Sandbox Account** → Login karo
- Ya phir purchase karte waqt Sandbox account se login karo

---

### 6. **Network/Firewall Check**

**Agar internet theek hai, phir bhi issue hai:**

1. **VPN off karo** (agar ON hai)
2. **Corporate network** se disconnect karo (firewall block kar sakta hai)
3. **Mobile data** use karo (Wi-Fi ki jagah)
4. **App Store** manually open karo (check karo ke accessible hai)

---

## 🔍 Debugging Steps

### Step 1: Check Logs

**Xcode Console mein logs dekho:**

1. **Xcode** open karo
2. **Window** → **Devices and Simulators**
3. Device select karo
4. **Open Console** button
5. App run karo aur purchase try karo
6. Logs check karo:

**Expected logs:**
```
✅ IAP: Native module loaded successfully
🔄 IAP: Attempting to connect to App Store...
✅ IAP: Connected to App Store successfully
🔄 IAP: Fetching products from App Store...
✅ IAP: Products fetched successfully
```

**Error logs:**
```
❌ IAP: Connection failed: [error message]
❌ IAP: Product not found
❌ IAP: Module not available
```

---

### Step 2: Verify Product ID

**Code mein Product ID check karo:**

```bash
cd AutoFinder-App
grep -r "dealer_monthly_ios" src/
```

**Expected:**
```
src/services/iapService.ts:const DEALER_PACKAGE_PRODUCT_ID = 'dealer_monthly_ios';
```

**App Store Connect mein bhi same Product ID hona chahiye!**

---

### Step 3: Test Connection

**Manual test karo:**

1. **Settings** → **App Store** → **Sandbox Account** → Login karo
2. App open karo
3. Purchase flow start karo
4. Error message check karo

---

## 🚨 Common Issues & Solutions

### Issue 1: "Product not found"

**Solution:**
- App Store Connect mein product create karo
- Product ID: `dealer_monthly_ios` (exact match)
- Status: "Ready to Submit"

---

### Issue 2: "Connection timeout"

**Solution:**
- Internet connection check karo
- VPN off karo
- Mobile data use karo
- Thoda wait karo aur phir try karo

---

### Issue 3: "Module not available"

**Solution:**
- EAS build use karo (Expo Go nahi)
- `npm run build:ios` run karo
- Build complete hone ke baad test karo

---

### Issue 4: "Bundle ID mismatch"

**Solution:**
- App Store Connect mein Bundle ID check karo
- `app.json` mein same Bundle ID set karo
- EAS build phir se create karo

---

## 📋 Quick Checklist

**Before Testing:**

- [ ] App Store Connect mein product `dealer_monthly_ios` configured hai
- [ ] Product status: "Ready to Submit"
- [ ] Bundle ID match kar raha hai (Xcode, App Store Connect, app.json)
- [ ] App status: "Ready for Submission" ya "In Review"
- [ ] EAS build successfully complete hua hai
- [ ] Sandbox tester account create kiya hai
- [ ] Device par Sandbox account se login kiya hai
- [ ] Internet connection active hai
- [ ] VPN off hai (agar ON hai)

---

## 🎯 Most Likely Issue

**90% cases mein issue yeh hai:**

1. **Product ID App Store Connect mein configured nahi hai**
   - Solution: Product create karo with ID `dealer_monthly_ios`

2. **Product status "Ready to Submit" nahi hai**
   - Solution: Product configuration complete karo

3. **Bundle ID mismatch**
   - Solution: Bundle ID verify karo aur match karo

---

## 🚀 Quick Fix Command

**Product ID verify karo:**
```bash
# Code mein Product ID
grep -r "DEALER_PACKAGE_PRODUCT_ID" AutoFinder-App/src/

# App Store Connect mein manually check karo
# https://appstoreconnect.apple.com → My Apps → Features → In-App Purchases
```

---

## 📞 Next Steps

1. **App Store Connect** mein product verify karo
2. **Bundle ID** match karo
3. **EAS build** phir se create karo
4. **Sandbox account** se test karo
5. **Logs** check karo agar issue aaye

---

**Main Fix:** Product ID App Store Connect mein properly configured hona chahiye! 🚀

