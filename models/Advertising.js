const mongoose = require("mongoose");

const advertisingSchema = new mongoose.Schema({
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
    enum: ["draft", "published"],
    default: "draft",
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    default: 0,
  },
});

const Advertising = mongoose.model("Advertising", advertisingSchema);

module.exports = Advertising;

