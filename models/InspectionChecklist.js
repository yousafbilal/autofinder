const mongoose = require('mongoose');

const ChecklistItemSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  critical: { type: Boolean, default: false },
});

const ChecklistCategorySchema = new mongoose.Schema({
  key: { type: String, required: true },
  title: { type: String, required: true },
  weight: { type: Number, required: true }, // percentage (e.g., 20)
  items: [ChecklistItemSchema],
});

const InspectionChecklistSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true, unique: true },
    categories: [ChecklistCategorySchema],
    locale: { type: String, default: 'en-PK' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InspectionChecklist', InspectionChecklistSchema);


