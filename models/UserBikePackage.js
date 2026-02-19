const mongoose = require('mongoose');

const UserBikePackageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  packageId: { type: String, required: true },
  packageName: { type: String, required: true },
  price: { type: Number, required: true },
  validityDays: { type: Number, required: true },
  liveAdDays: { type: Number, required: true },
  totalAds: { type: Number, required: true },
  adsRemaining: { type: Number, required: true },
  boostersTotal: { type: Number, required: true },
  boostersRemaining: { type: Number, required: true },
  status: { type: String, enum: ['active','expired'], default: 'active' },
  purchasedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model('UserBikePackage', UserBikePackageSchema);



