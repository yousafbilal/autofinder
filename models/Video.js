const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  publish_date: {
    type: Date,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  status: {
    type : String,
    enum: ["draft", "published"],
    default: "draft",
  },
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  tags: {
    type: [String], 
  },
  image1: { type: String },
});

const Video = mongoose.model("Video", productSchema);

module.exports = Video;
