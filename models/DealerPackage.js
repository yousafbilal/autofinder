const mongoose = require("mongoose");

const dealerPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ["car", "bike", "booster"],
    required: true,
  },
  price: {
    type: Number,
    min: 0,
  },
  duration: {
    type: Number,
    min: 1,
  },
  listingLimit: {
    type: Number,
    min: 1,
  },
  featuredListings: {
    type: Number,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  features: [{
    type: String,
    trim: true,
  }],
  popular: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "archived"],
    default: "active",
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
  dateModified: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  // New format fields - optional for backward compatibility
  bundleName: {
    type: String,
    trim: true,
  },
  noOfDays: {
    type: Number,
    min: 1,
  },
  packageExpiryDays: {
    type: Number,
    min: 1,
  },
  noOfBoosts: {
    type: Number,
    min: 1,
  },
  actualPrice: {
    type: Number,
    min: 0,
  },
  discountedRate: {
    type: Number,
    min: 0,
  },
  youSaved: {
    type: Number,
    min: 0,
  },
});

// Update dateModified on save
dealerPackageSchema.pre('save', function(next) {
  this.dateModified = new Date();
  next();
});

// Custom validation for new format fields
dealerPackageSchema.pre('validate', function(next) {
  // If this is a booster package, ensure new format fields are present
  if (this.type === 'booster') {
    if (!this.bundleName || !this.noOfDays || !this.packageExpiryDays || !this.noOfBoosts || 
        !this.actualPrice || !this.discountedRate || this.youSaved === undefined) {
      return next(new Error('Booster packages require: bundleName, noOfDays, packageExpiryDays, noOfBoosts, actualPrice, discountedRate, youSaved'));
    }
  }
  
  // If this is a bike package with new format, ensure new format fields are present
  if (this.type === 'bike' && (this.bundleName || this.noOfDays || this.noOfBoosts)) {
    if (!this.bundleName || !this.noOfDays || !this.packageExpiryDays || !this.noOfBoosts || 
        !this.actualPrice || !this.discountedRate || this.youSaved === undefined) {
      return next(new Error('Bike packages with new format require: bundleName, noOfDays, packageExpiryDays, noOfBoosts, actualPrice, discountedRate, youSaved'));
    }
  }
  
  // If this is a car package with new format, ensure new format fields are present
  if (this.type === 'car' && (this.bundleName || this.noOfDays || this.noOfBoosts)) {
    if (!this.bundleName || !this.noOfDays || !this.packageExpiryDays || !this.noOfBoosts || 
        !this.actualPrice || !this.discountedRate || this.youSaved === undefined) {
      return next(new Error('Car packages with new format require: bundleName, noOfDays, packageExpiryDays, noOfBoosts, actualPrice, discountedRate, youSaved'));
    }
  }
  
  next();
});

const DealerPackage = mongoose.model("DealerPackage", dealerPackageSchema);

module.exports = DealerPackage;
