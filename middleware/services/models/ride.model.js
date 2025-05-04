const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  customerId: { type: String, required: true },
  driverId: { type: String, required: true },
  pickupLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    addressLine: String
  },
  dropoffLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    addressLine: String
  },
  status: String,
  requestTimestamp: Date,
  acceptTimestamp: Date,
  pickupTimestamp: Date,
  dropoffTimestamp: Date,
  predictedFare: Number,
  actualFare: Number,
  distance: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ride', RideSchema);
