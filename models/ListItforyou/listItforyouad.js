const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    // Admin who added this property (for Managed by AutoFinder ads)
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      default: false, // Changed to false for pending approval
    },
    isManaged: {
      type: Boolean,
      default: true,
    },
    // Premium ad status for admin approval
    adStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
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
    invoiceImage: { type: String },
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

const listItforyouAd = mongoose.model("listItforyouAd", productSchema);

module.exports = listItforyouAd;
