const mongoose = require("mongoose");

const bikeSchema = new mongoose.Schema({
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["draft", "pending", "active", "rejected"],
    default: "pending", // Changed to pending for admin approval
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
  featured: {
    type: Boolean,
    default: false,
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
  price: {
    type: Number,
    required: true,
  },
  bodyType: {
    type: String, // cruiser, sport, commuter, etc.
  },
  fuelType: {
    type: String, // petrol, electric
  },

  // Key specs
  engineCapacity: {
    type: String, // e.g., "155cc"
  },
  power: {
    type: String, // e.g., "19.3 bhp"
  },
  torque: {
    type: String,
  },
  topSpeed: {
    type: String,
  },
  mileage: {
    type: String,
  },
  batteryCapacity: {
    type: String, // for electric bikes
  },
  chargingTime: {
    type: String,
  },
  transmission: {
    type: String,
  },
  kerbWeight: {
    type: String,
  },
  seatHeight: {
    type: String,
  },
  fuelTankCapacity: {
    type: String,
  },
  groundClearance: {
    type: String,
  },
  wheelbase: {
    type: String,
  },
  brakingSystem: {
    type: String, // e.g., "ABS", "CBS"
  },

  frontBrakeType: {
    type: String,
  },
  rearBrakeType: {
    type: String,
  },
  frontSuspension: {
    type: String,
  },
  rearSuspension: {
    type: String,
  },

  tyreType: {
    type: String,
  },
  wheelType: {
    type: String,
  },
  numberOfGears: {
    type: String,
  },

  // Features
  ledHeadlamp: {
    type: Boolean,
    default: false,
  },
  digitalConsole: {
    type: Boolean,
    default: false,
  },
  usbChargingPort: {
    type: Boolean,
    default: false,
  },
  bluetoothConnectivity: {
    type: Boolean,
    default: false,
  },
  navigation: {
    type: Boolean,
    default: false,
  },
  abs: {
    type: Boolean,
    default: false,
  },
  slipperClutch: {
    type: Boolean,
    default: false,
  },
  quickShifter: {
    type: Boolean,
    default: false,
  },

  favoritedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  image1: { type: String },
  image2: { type: String },
  image3: { type: String },
  image4: { type: String },
  image5: { type: String },
  image6: { type: String },
  image7: { type: String },
  image8: { type: String },
});

const New_Bike = mongoose.model("New_Bike", bikeSchema);

module.exports = New_Bike;
