const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  InspectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inspector",
    required: true,
  },
  inspectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inspection",
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
    enum: ["Rejected", "Assigned", "Completed"],
    default: "Assigned",
  },
  inspection_date: {
    type: String,
  },
  inspection_time: {
    type: String,
  },
  
});

const Car_Inspection = mongoose.model("Car_Inspection", productSchema);

module.exports = Car_Inspection;
