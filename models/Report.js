const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  listingType: {
    type: String,
    required: true,
    enum: ['free_ad', 'featured_ad', 'list_it_for_you', 'new_car', 'bike_ad', 'rent_car', 'autopart']
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'Misleading information about vehicle condition',
      'Suspicious pricing - too low for model year',
      'Fake contact information',
      'Inappropriate content',
      'Spam or duplicate listing',
      'Vehicle already sold',
      'Other'
    ]
  },
  description: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Action Taken'],
    default: 'Pending'
  },
  adminNotes: {
    type: String,
    maxlength: 500
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  reviewedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Update the updatedAt field before saving
reportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
