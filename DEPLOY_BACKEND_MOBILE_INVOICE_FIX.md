# Mobile app: "Unexpected file field: invoiceImage" – fix by deploying backend

## Problem
When users post a **premium bike ad** with a **payment receipt** from the mobile app, the server returns:
```json
{"error": "UNEXPECTED_FILE_FIELD", "message": "Unexpected file field: invoiceImage", "success": false}
```

This happens when the **API server is running old code** that does not allow the `invoiceImage` field on `POST /bike_ads`.

## Fix (server side)
The backend in this repo **already supports** `invoiceImage` for bike ads:

- **File:** `index.js`
- **Multer:** `bikeAdsImageFields` includes `{ name: 'invoiceImage', maxCount: 1 }`
- **Handler:** `POST /bike_ads` saves `invoiceImage: getPath(files.invoiceImage)` in the saved ad

You must **deploy this updated backend** on the server that the mobile app calls (the one used in the app’s `API_URL`).

### Steps
1. On the **server** where the Node/Express API runs (same host that serves the mobile app’s API):
   - Copy the latest `index.js` from this repo (or pull the latest code).
   - Ensure the running process uses this updated file (restart the Node process after updating).
2. Restart the backend service, for example:
   - `pm2 restart all` (if you use PM2)
   - Or restart the process you use to run `node index.js`.
3. Test from the app: post a premium bike ad with a payment receipt; it should succeed without the "Unexpected file field: invoiceImage" error.

### Important
- **Dashboard** and **website** updates do **not** update the **API server**. The mobile app talks to the backend API; that backend must be redeployed and restarted for this fix to apply.
- Use the **same** `index.js` that contains the `invoiceImage` support for `bike_ads` (the code around the `bikeAdsImageFields` and `POST /bike_ads` handler in this repo).

## Quick check on server
After deploying, you can confirm the route accepts the field by checking that the running code has:

- In `index.js`, near the bike ads section:
  - `bikeAdsImageFields.push({ name: 'invoiceImage', maxCount: 1 });`
  - In the `POST /bike_ads` handler, the saved doc includes: `invoiceImage: getPath(files.invoiceImage)`

If both are present and the process was restarted, the mobile app’s receipt upload for premium bike ads should work.
