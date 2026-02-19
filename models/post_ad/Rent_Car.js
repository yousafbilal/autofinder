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
  isSold:{
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
  },
  title: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  make: {
    type: String,
    required: true,
  },
  bodyType: {
    type: String,
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
  preferredContact: {
    type: String, // Now accepting any string value from frontend
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
  transmission: {
    type: String, // Now accepting any string value from frontend
  },
  assembly: {
    type: String, // Now accepting any string value from frontend
  },
  paymenttype:{
    type:String,
  },
  documents:{
    type:String,
  },
  drivingtype: {
    type: String, 
  },
  features: {
    type: [String], // Array of features
  },
  availabilityType: {
    type: String,
    enum: ["day", "week", "month"],
  },
  availabilityDates: {
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
  // Monetization & lifecycle fields for rent service
  isPaidAd: {
    type: Boolean,
    default: false,
  },
  paymentAmount: {
    type: Number,
    default: 0,
  },
  paymentStatus: {
    type: String,
    enum: ['free', 'pending', 'verified', 'rejected'],
    default: 'pending',
  },
  paymentReceipt: { type: String },
  validityDays: { type: Number, default: 15 },
  expiryDate: { type: Date },
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
});

const Rent_Car  = mongoose.model("Rent_Car", productSchema);

module.exports = Rent_Car;
