const mongoose = require('mongoose');

const mobilePackagePurchaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
    ref: 'User',
    required: true
  },
  packageId: {
    type: String,
    required: true
  },
  packageName: {
    type: String,
    required: true
  },
  packageType: {
    type: String,
    enum: ['car', 'bike', 'booster'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  receiptImage: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  approvedBy: {
    type: String
  },
  rejectionReason: {
    type: String
  },
  adminNotes: {
    type: String
  },
  // Additional customer information
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    default: 'Bank Transfer'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  // Package metrics (optional)
  liveAdDays: {
    type: Number,
    default: 0
  },
  validityDays: {
    type: Number,
    default: 0
  },
  freeBoosters: {
    type: Number,
    default: 0
  },
  totalAds: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: false
  },
  expiryDate: {
    type: Date
  },
  // Package Usage Tracking
  usage: {
    totalAds: { type: Number, default: 0 },
    adsUsed: { type: Number, default: 0 },
    adsRemaining: { type: Number, default: 0 },
    totalBoosters: { type: Number, default: 0 },
    boostersUsed: { type: Number, default: 0 },
    boostersRemaining: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Index for better query performance
mobilePackagePurchaseSchema.index({ userId: 1, status: 1 });
mobilePackagePurchaseSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('MobilePackagePurchase', mobilePackagePurchaseSchema);
