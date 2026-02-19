const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Account Issues', 'Payment Problems', 'Listing Issues', 'App Bugs', 'Feature Request', 'Other'],
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  attachments: [{
    filename: String,
    originalName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String,
  }],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending',
  },
  adminResponse: {
    type: String,
    default: '',
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  dateResolved: {
    type: Date,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SupportRequest', supportRequestSchema);

