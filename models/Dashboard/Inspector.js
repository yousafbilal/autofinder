const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: null,
  },
  inspections: [
    {
      inspectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inspection",
      },
      status: {
        type: String,
        enum: ["Pending", "Rejected", "Scheduled", "Completed"],
        default: "Pending",
      },
    },
  ],
});

const Inspector = mongoose.model("Inspector", productSchema);

module.exports = Inspector;
