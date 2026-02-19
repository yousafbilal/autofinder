const mongoose = require("mongoose");

const dealerPackageRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DealerPackage",
    required: true,
  },
  customerInfo: {
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    businessType: {
      type: String,
      required: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
    },
  },
  paymentInfo: {
    method: {
      type: String,
      required: true,
      enum: ["Credit Card", "PayPal", "Bank Transfer", "Stripe", "Other"],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled"],
    default: "pending",
  },
  requestDate: {
    type: Date,
    default: Date.now,
  },
  approvedDate: {
    type: Date,
  },
  rejectedDate: {
    type: Date,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  notes: {
    type: String,
    trim: true,
  },
  rejectionReason: {
    type: String,
    trim: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const DealerPackageRequest = mongoose.model("DealerPackageRequest", dealerPackageRequestSchema);

module.exports = DealerPackageRequest;
