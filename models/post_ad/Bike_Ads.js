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
  isActive: {
    type: Boolean,
    default: true,
  },
   isSold: {
    type: Boolean,
    default: true,
  },
  location: {
    type: String,
    required: true,
  },
  adCity: {
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
    required: true,
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
    default: 0,
  },
  fuelType: {
    type: String, // Now accepting any string value from frontend
  },
  engineCapacity: {
    type: String,
  },
  description: {
    type: String,
  },
  enginetype: {
    type: String, // Now accepting any string value from frontend
  },
  title: {
    type: String, // Now accepting any string value from frontend
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
  
  // Featured Ad Fields
  isFeatured: {
    type: String,
    enum: ["Pending", "Rejected", "Approved"],
    // No default value - only set for premium ads
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
  paymentAmount: {
    type: Number,
  },
  invoiceImage: {
    type: String,
  },
  featuredExpiryDate: {
    type: Date,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  adminNotes: {
    type: String,
    default: '',
  },
  statusUpdatedAt: {
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
  // Free bike ad expiry date (16 days from dateAdded)
  expiryDate: {
    type: Date,
  },
});

const Bike_Ads = mongoose.model("Bike_Ads", productSchema);

module.exports = Bike_Ads;
