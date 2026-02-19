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
  status:{
    type : String,
    enum: ["Pending", "Rejected", "Scheduled", "Completed"],
    default: "Pending",
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
  inspection_date: {
    type: String,
  },
  inspection_time: {
    type: String,
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
  inspectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inspector",
  },
  InspectorId:{
    type: String,
  },
  assigned_inspection_date: {
    type: String,
  },
  assigned_inspection_time: {
    type: String,
  },
  inspectionReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InspectionReport",
  },
  paymentReceiptImages: [{
    type: String, // Store image URLs
  }],
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending",
  },
  paymentAmount: {
    type: Number,
    default: 0,
  },
  inspectorNotes: {
    type: String,
  },
  completedDate: {
    type: Date,
  },
  adId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Free_Ad", // Reference to car ad (can be Free_Ad or New_Car)
    default: null,
  }

});

const Inspection = mongoose.model("Inspection", productSchema);

module.exports = Inspection;
