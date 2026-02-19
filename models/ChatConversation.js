const mongoose = require('mongoose');

const ChatConversationSchema = new mongoose.Schema({
  adId: { type: mongoose.Schema.Types.ObjectId, required: false },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastMessage: { type: String },
  updatedAt: { type: Date, default: Date.now },
  lastReadAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Remove the unique constraint on adId since we want to allow updating it
ChatConversationSchema.index({ buyerId: 1, sellerId: 1 }, { unique: true });

module.exports = mongoose.model('ChatConversation', ChatConversationSchema);
