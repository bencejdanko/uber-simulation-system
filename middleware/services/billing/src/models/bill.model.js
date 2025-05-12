const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Bill schema
const BillSchema = new Schema({
  billingId: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{3}-\d{2}-\d{4}$/ // SSN Format validation
  },
  rideId: {
    type: String,
    required: true,
    match: /^\d{3}-\d{2}-\d{4}$/, // SSN Format validation
    index: true
  },
  customerId: {
    type: String,
    required: true,
    match: /^\d{3}-\d{2}-\d{4}$/, // SSN Format validation
    index: true
  },
  driverId: {
    type: String,
    required: true,
    match: /^\d{3}-\d{2}-\d{4}$/, // SSN Format validation
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  pickupTime: {
    type: Date,
    required: true
  },
  dropoffTime: {
    type: Date,
    required: true
  },
  distanceCovered: {
    type: Number,
    required: true,
    min: 0
  },
  sourceLocation: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    addressLine: String
  },
  destinationLocation: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    addressLine: String
  },
  predictedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  actualAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'VOID'],
    default: 'PENDING'
  },
  paymentDetails: {
    method: {
      type: String,
      enum: ['CREDIT_CARD', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY'],
      default: 'CREDIT_CARD'
    },
    last4: String,
    transactionId: String
  },
  fareBreakdown: {
    baseAmount: Number,
    distanceAmount: Number,
    timeAmount: Number,
    surge: Number,
    taxes: Number,
    driverPayout: Number,
    platformFee: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt
});

// Create indexes for efficient querying
BillSchema.index({ date: 1 });
BillSchema.index({ paymentStatus: 1 });
BillSchema.index({ 'sourceLocation.latitude': 1, 'sourceLocation.longitude': 1 });
BillSchema.index({ 'destinationLocation.latitude': 1, 'destinationLocation.longitude': 1 });

// Pre-save middleware to update the updatedAt field
BillSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a virtual for the ride duration in minutes
BillSchema.virtual('rideDuration').get(function() {
  if (this.pickupTime && this.dropoffTime) {
    return Math.round((this.dropoffTime - this.pickupTime) / (1000 * 60));
  }
  return null;
});

// Method to calculate the driver's payout
BillSchema.methods.calculateDriverPayout = function() {
  // Default driver payout is 80% of the actual amount
  const driverPercentage = 0.8;
  return this.actualAmount * driverPercentage;
};

// Static method to find bills by date range
BillSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  });
};

// Export the model
module.exports = mongoose.model('Bill', BillSchema);