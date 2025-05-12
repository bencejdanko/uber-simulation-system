const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  }
}, { _id: false });

const rideSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    match: /^\d{3}-\d{2}-\d{4}$/,
    unique: true
  },
  customerId: {
    type: String,
    ref: 'Customer',
    required: true
  },
  driverId: {
    type: String,
    ref: 'Driver',
    required: true
  },
  pickup: {
    type: locationSchema,
    required: true
  },
  dropoff: {
    type: locationSchema,
    required: true
  },
  requestTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  pickupTime: {
    type: Date
  },
  dropoffTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'requested'
  },
  distance: {
    type: Number, // in miles
    min: 0
  },
  duration: {
    type: Number, // in minutes
    min: 0
  },
  estimatedFare: {
    type: Number,
    min: 0
  },
  finalFare: {
    type: Number,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  cancelledBy: {
    type: String,
    enum: ['customer', 'driver', 'system'],
  },
  cancellationReason: {
    type: String
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for bill (will populate in queries)
rideSchema.virtual('bill', {
  ref: 'Bill',
  localField: '_id',
  foreignField: 'rideId',
  justOne: true
});

// Virtual for review (will populate in queries)
rideSchema.virtual('review', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'rideId',
  justOne: true
});

// Indexes for faster querying
rideSchema.index({ customerId: 1 });
rideSchema.index({ driverId: 1 });
rideSchema.index({ status: 1 });
rideSchema.index({ date: -1 });
rideSchema.index({ 'pickup.city': 1, 'pickup.state': 1 });
rideSchema.index({ 'dropoff.city': 1, 'dropoff.state': 1 });

const Ride = mongoose.model('Ride', rideSchema);

module.exports = Ride; 