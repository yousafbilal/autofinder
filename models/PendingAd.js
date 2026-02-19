const mongoose = require('mongoose');

const pendingAdSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adData: {
    type: Object,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['easypaisa', 'jazzcash'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentSlip: {
    type: String, // File path to uploaded slip
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PendingAd = mongoose.model('PendingAd', pendingAdSchema);

module.exports = PendingAd;
