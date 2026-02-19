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
  isApproved:{
    type : String,
    enum: ["Pending", "Rejected", "Approved"],
    default: "Pending",
  },
  category: {
    type: String,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  kmDriven: {
    type: Number,
  },
  engineCapacity: {
    type: String,
  },
  price: {
    type: Number,
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
  description: {
    type: String,
  },
  invoiceImage: {
    type: String,
  },
  selectedPlan: {
    type: String,
  },
});

const listItforyou = mongoose.model("listItforyou", productSchema);

module.exports = listItforyou;
