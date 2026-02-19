const mongoose = require("mongoose");

const autoPartSchema = new mongoose.Schema({
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
    default: false,
  },
  location: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  partType: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
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

const AutoStoreAd = mongoose.model("AutoStoreAd", autoPartSchema);

module.exports = AutoStoreAd;
