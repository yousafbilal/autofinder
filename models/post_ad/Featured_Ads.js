const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  isFeatured: {
    type: String,
    enum: ["Pending", "Rejected", "Approved"],
    default: "Pending",
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  isSold: {
    type: Boolean,
    default: false,
  },
  location: {
    type: String,
    required: true,
  },
  make: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
  },
  year: {
    type: Number,
    required: true,
  },
  registrationCity: {
    type: String,
  },
  bodyType: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  bodyColor: {
    type: String,
  },
  kmDriven: {
    type: Number,
  },
  fuelType: {
    type: String,
  },
  engineCapacity: {
    type: String,
  },
  description: {
    type: String,
  },
  transmission: {
    type: String,
  },
  assembly: {
    type: String,
  },
  features: {
    type: [String], 
  },
  preferredContact: {
    type: String, // Now accepting any string value from frontend
  },
  favoritedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  views: {
    type: Number,
    default: 0,
  },
  image1: { type: String },
  image2: { type: String },
  image3: { type: String },
  image4: { type: String },
  image5: { type: String },
  image6: { type: String },
  image7: { type: String },
  image8: { type: String },
  image9: { type: String },
  image10: { type: String },
  image11: { type: String },
  image12: { type: String },
  image13: { type: String },
  image14: { type: String },
  image15: { type: String },
  image16: { type: String },
  image17: { type: String },
  image18: { type: String },
  image19: { type: String },
  image20: { type: String },
  invoiceImage: {
    type: String,
  },
  selectedPlan: {
    type: String,
  },
  packageId: {
    type: String,
  },
  packageName: {
    type: String,
  },
  packagePrice: {
    type: Number,
  },
  paymentReceiptImages: {
    type: [String],
    default: []
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  paymentAmount: {
    type: Number,
  },
  approvedAt: {
    type: Date,
  },
  featuredExpiryDate: {
    type: Date,
  },
  // ✅ Boost fields for "Boost Your Ad" feature
  isBoosted: {
    type: Boolean,
    default: false,
  },
  boostedAt: {
    type: Date,
  },
  boostedUntil: {
    type: Date,
  },
  priorityScore: {
    type: Number,
  },
});

const Featured_Ads = mongoose.model("Featured_Ads", productSchema);

module.exports = Featured_Ads;
