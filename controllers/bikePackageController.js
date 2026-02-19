const UserBikePackage = require('../models/UserBikePackage');
const FeaturedBikeAd = require('../models/post_ad/Featured_Ads');

exports.approveStarterPack = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const doc = await UserBikePackage.create({
      userId,
      packageId: 'bike-starter',
      packageName: 'Starter Pack',
      price: 149,
      validityDays: 30,
      liveAdDays: 15,
      totalAds: 5,
      adsRemaining: 5,
      boostersTotal: 1,
      boostersRemaining: 1,
      status: 'active',
      purchasedAt: now,
      expiresAt,
    });

    return res.json({ success: true, id: doc._id });
  } catch (err) {
    console.error('approveStarterPack error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getUsage = async (req, res) => {
  try {
    const { userId } = req.params;
    const pkg = await UserBikePackage.findOne({ userId, status: 'active', expiresAt: { $gt: new Date() } }).lean();
    if (!pkg) return res.json({ active: false });
    const daysRemaining = Math.max(0, Math.ceil((pkg.expiresAt.getTime() - Date.now()) / (1000*60*60*24)));
    return res.json({
      active: true,
      packageName: pkg.packageName,
      adsRemaining: pkg.adsRemaining,
      boostersRemaining: pkg.boostersRemaining,
      validityDays: pkg.validityDays,
      daysRemaining,
    });
  } catch (err) {
    console.error('getUsage error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.postFeaturedBikeAd = async (req, res) => {
  try {
    const { userId, title } = req.body;
    const pkg = await UserBikePackage.findOne({ userId, status: 'active', expiresAt: { $gt: new Date() } });
    if (!pkg) return res.status(402).json({ success: false, reason: 'no_active_package' });
    if (pkg.adsRemaining <= 0) return res.status(402).json({ success: false, reason: 'ads_exhausted' });

    // Create ad with limited live days
    const ad = await FeaturedBikeAd.create({
      ...req.body,
      isFeatured: 'Pending',
    });

    pkg.adsRemaining -= 1;
    await pkg.save();

    return res.json({ success: true, adId: ad._id, adsRemaining: pkg.adsRemaining });
  } catch (err) {
    console.error('postFeaturedBikeAd error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.useBooster = async (req, res) => {
  try {
    const { userId } = req.body;
    const pkg = await UserBikePackage.findOne({ userId, status: 'active', expiresAt: { $gt: new Date() } });
    if (!pkg) return res.status(402).json({ success: false, reason: 'no_active_package' });
    if (pkg.boostersRemaining <= 0) return res.status(402).json({ success: false, reason: 'no_boosters' });
    pkg.boostersRemaining -= 1;
    await pkg.save();
    return res.json({ success: true, boostersRemaining: pkg.boostersRemaining });
  } catch (err) {
    console.error('useBooster error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};



