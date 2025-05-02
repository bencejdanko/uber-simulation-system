const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  _id: { type: String, match: /^\d{3}-\d{2}-\d{4}$/, required: true },
  customerId: { type: String, match: /^\d{3}-\d{2}-\d{4}$/, required: true },
  driverId: { type: String, match: /^\d{3}-\d{2}-\d{4}$/, required: true },
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
