
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
  preferredContact: {
    type: String, // Now accepting any string value from frontend
  },
  priceTo: {
    type: Number,
    required: true,
  },
  priceFrom: {
    type: Number,
    required: true,
  },
  transmission: {
    type: String,
  },
  description: {
    type: String,
  },
  paymentReceipt: {
    type: String,
  },
  comments: {
    type: String,
  },
  isActive: {
    type: String,
    enum: ["Pending", "Rejected","InProgress", "Completed"],
    default: "Pending",
  },
});

const BuyCarForMe = mongoose.model("BuyCarForMe", productSchema);

module.exports = BuyCarForMe;
