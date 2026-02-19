const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'welcome',
      'new_message',
      'ad_created',
      'ad_status',
      'free_ad_status_updated',
      'premium_ad_status_updated',
      'bike_ad_status_updated',
      'new_car_status_updated',
      'new_bike_status_updated',
      'list_it_for_you_status_updated',
      'featured_ad_status_updated',
      'request_created',
      'request_status',
      'buy_car_request_created'
    ]
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Active', 'Inactive'],
    default: 'Pending',
  },
  adId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'adModel',
  },
  adModel: {
    type: String,
    enum: ['Free_Ads', 'Featured_Ads', 'Bike_Ads', 'New_Car', 'New_Bike', 'listItforyouAd', 'Rent_Car', 'AutoStoreAd'],
  },
  adTitle: {
    type: String,
  },
  collection: {
    type: String,
  },
  read: {
    type: Boolean,
    default: false,
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

// Index for efficient queries
notificationSchema.index({ userId: 1, dateAdded: -1 });
notificationSchema.index({ userId: 1, read: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
