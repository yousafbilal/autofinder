# Server Update – Fix "Unexpected file field: invoiceImage" (Premium Bike Ad Receipt)

Mobile app tab tak yeh error aata rahega jab tak **API server par updated code deploy nahi hoga**. Yeh steps **server par** (jahan Node backend chal raha hai) follow karo.

---

## Option A: Full index.js replace (recommended)

1. **Server par SSH/login karo** (jahan `node index.js` ya backend service chal rahi hai).

2. **Backend folder mein jao**, e.g.:
   ```bash
   cd /path/to/your/backend
   # Example: cd /var/www/autofinder-backend
   ```

3. **Purana index.js backup lo**:
   ```bash
   cp index.js index.js.backup
   ```

4. **Naya index.js copy karo**  
   Apne computer se (jahan yeh repo hai) latest `autofinder-backend-orignal-/index.js` ko server par upload karo (SCP, SFTP, Git pull, ya copy-paste).  
   Server par same folder mein overwrite karo: `index.js`

5. **Backend restart karo**:
   - **PM2 use karte ho to:**
     ```bash
     pm2 restart all
     # ya
     pm2 restart index
     ```
   - **Systemd use karte ho to:**
     ```bash
     sudo systemctl restart your-backend-service-name
     ```
   - **Direct node chalate ho to:**  
     process stop karo (Ctrl+C) phir dubara:
     ```bash
     node index.js
     ```

6. **Mobile app se test karo:** Premium bike ad + payment receipt upload karo. Error nahi aana chahiye.

---

## Option B: Sirf 2 line add karna (manual edit)

Agar server par sirf **index.js** edit karna easy hai, to yeh 2 changes karo.

**1) Multer fields – `invoiceImage` add karo**

Dhundho (search karo):
```javascript
const bikeAdsImageFields = [];
for (let i = 1; i <= 20; i++) bikeAdsImageFields.push({ name: `image${i}`, maxCount: 1 });
```

Uske **turant neeche** ek nayi line add karo:
```javascript
bikeAdsImageFields.push({ name: 'invoiceImage', maxCount: 1 });
```

**2) Saved document mein `invoiceImage` add karo**

Dhundho:
```javascript
image6: getPath(files.image6)
    };
    const ad = new Bike_Ads(doc);
```

Replace karo isse:
```javascript
image6: getPath(files.image6),
      invoiceImage: getPath(files.invoiceImage)
    };
    const ad = new Bike_Ads(doc);
```

**3) File save karo, phir backend restart karo** (Option A ki tarah).

---

## Verify

Restart ke baad:

- Mobile app se premium bike ad post karo **with** payment receipt.
- Agar ab bhi "Unexpected file field: invoiceImage" aaye to check karo:
  - Jo `index.js` run ho raha hai wahi edited/updated file hai (correct path).
  - Restart hua hai (process purana code se nahi chal raha).

Yeh fix **backend server** par lagani zaroori hai; dashboard ya website update karne se yeh error fix nahi hota.
