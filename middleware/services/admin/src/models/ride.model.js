// src/models/ride.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the schema for the ride model
const rideSchema = new Schema({
  rideId: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{3}-\d{2}-\d{4}$/, // Ensure SSN format for rideId (xxx-xx-xxxx)
  },
  customerId: {
    type: String,
    required: true,
    match: /^\d{3}-\d{2}-\d{4}$/, // Ensure SSN format for customerId (xxx-xx-xxxx)
  },
  driverId: {
    type: String,
    match: /^\d{3}-\d{2}-\d{4}$/, // Ensure SSN format for driverId (xxx-xx-xxxx) if assigned
    default: null, // No driver assigned initially
  },
  pickupLocation: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    addressLine: {
      type: String,
      default: null, // Optional addressLine for pickup
    },
  },
  dropoffLocation: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    addressLine: {
      type: String,
      default: null, // Optional addressLine for dropoff
    },
  },
  status: {
    type: String,
    required: true,
    enum: [
      'REQUESTED',
      'ACCEPTED',
      'DRIVER_ARRIVED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED_CUSTOMER',
      'CANCELLED_DRIVER',
      'NO_DRIVERS_AVAILABLE',
    ], // Enum of valid statuses
  },
  requestTimestamp: {
    type: Date,
    required: true,
  },
  acceptTimestamp: {
    type: Date,
    default: null, // Nullable if not accepted yet
  },
  pickupTimestamp: {
    type: Date,
    default: null, // Nullable if ride hasn't started
  },
  dropoffTimestamp: {
    type: Date,
    default: null, // Nullable if ride hasn't ended
  },
  predictedFare: {
    type: Number,
    default: null, // Nullable until calculated
  },
  actualFare: {
    type: Number,
    default: null, // Nullable until ride completes
  },
  distance: {
    type: Number,
    default: null, // Nullable until ride completes
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the creation date
  },
  updatedAt: {
    type: Date,
    default: Date.now, // Automatically set the update date
  },
});

// Add pre-save hook to update updatedAt field automatically
rideSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create the model
const Ride = mongoose.model('Ride', rideSchema);

module.exports = Ride;
