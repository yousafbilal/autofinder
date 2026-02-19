const mongoose = require("mongoose");

const fuelPriceSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
  },
  price: {
    type: Number,
    required: true,
  },
  change: {
    type: Number,
    default: 0,
  },
  changePercent: {
    type: Number,
    default: 0,
  },
  icon: {
    type: String,
    default: "flash",
  },
  color: {
    type: String,
    default: "#FF6B6B",
  },
  gradient: {
    type: [String],
    default: ["#FF6B6B", "#FF8E8E"],
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const FuelPrice = mongoose.model("FuelPrice", fuelPriceSchema);

module.exports = FuelPrice;

