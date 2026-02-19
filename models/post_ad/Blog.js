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
  excerpt: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  tags: {
    type: [String], 
  },
  image1: { type: String },
});

const Blog = mongoose.model("Blog", productSchema);

module.exports = Blog;
