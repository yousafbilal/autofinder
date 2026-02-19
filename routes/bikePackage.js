const express = require('express');
const router = express.Router();
const multer = require('multer');
const bikePkg = require('../controllers/bikePackageController');

const upload = multer({ dest: 'uploads/' });
const bikeAdFields = [
  ...Array.from({ length: 20 }, (_, i) => ({ name: `image${i + 1}` })),
  { name: 'invoiceImage', maxCount: 1 }
];

// Admin approves Starter Pack purchase
router.post('/bike-packages/approve-starter', bikePkg.approveStarterPack);

// Usage fetch
router.get('/bike-packages/usage/:userId', bikePkg.getUsage);

// Post featured bike ad with quota enforcement
router.post('/bike-packages/featured-ads', upload.fields(bikeAdFields), bikePkg.postFeaturedBikeAd);

// Use a booster
router.post('/bike-packages/use-booster', bikePkg.useBooster);

module.exports = router;



