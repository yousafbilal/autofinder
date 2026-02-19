const mongoose = require('mongoose');

const InspectionMediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['photo', 'video'], required: true },
  url: { type: String, required: true },
  thumbUrl: { type: String },
  takenAt: { type: Date },
});

const InspectionItemSchema = new mongoose.Schema({
  key: { type: String, required: true },
  title: { type: String, required: true },
  result: { type: String, enum: ['Pass', 'Fail', 'Advisory', 'NA'], default: 'NA' },
  notes: { type: String, default: '' },
  media: [InspectionMediaSchema],
});

const InspectionCategorySchema = new mongoose.Schema({
  key: { type: String, required: true },
  title: { type: String, required: true },
  weight: { type: Number, default: 10 },
  items: [InspectionItemSchema],
});

const InspectionJobSchema = new mongoose.Schema(
  {
    // Ad association
    adRef: {
      modelName: {
        type: String,
        enum: ['Free_Ads', 'Featured_Ads', 'ListItForYou', 'NewCarData', 'Rent_Car', 'Bike_Ads'],
        required: true,
      },
      adId: { type: mongoose.Schema.Types.ObjectId, required: true },
    },
    // Actors
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requestedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Lifecycle & request
    requestType: { type: String, enum: ['free', 'paid', 'managed'], default: 'paid' },
    requestedAt: { type: Date },
    assignedAt: { type: Date },
    inspectedAt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'submitted', 'approved', 'rejected', 'cancelled', 'Requested', 'Scheduled', 'InProgress', 'Submitted', 'Approved', 'Rejected', 'Cancelled'],
      default: 'pending',
    },
    // Checklist & scoring
    checklistVersion: { type: Number, default: 1 },
    categories: [InspectionCategorySchema],
    detailed_checklist: { type: Object, default: {} },
    scores: {
      byCategory: { type: Map, of: Number, default: {} },
      overall: { type: Number, default: 0 },
    },
    overall_score: { type: Number, default: 0 }, // 0-100
    overall_rating: { type: Number, default: 0 }, // 0-10
    summary_text: { type: String, default: '' },
    summary: {
      verdict: { type: String, default: '' },
      highlights: { type: [String], default: [] },
      issues: { type: [String], default: [] },
    },
    // Media & documents
    media: [InspectionMediaSchema],
    photos: [{ url: String, caption: String, geotag: String, timestamp: Date }],
    documents: [{ url: String, caption: String }],
    // PDF and verification
    pdf: {
      url: { type: String, default: '' },
      generatedAt: { type: Date },
      hash: { type: String, default: '' },
    },
    verification_code: { type: String, default: '' },
    watermark_hash: { type: String, default: '' },
    // Expiry and audit
    expiry_date: { type: Date },
    audit: {
      approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approved_at: { type: Date },
      admin_notes: { type: String, default: '' },
      rejected_reason: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InspectionJob', InspectionJobSchema);


