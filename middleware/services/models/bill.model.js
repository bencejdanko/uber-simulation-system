const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  rideId: { type: String, required: true },
  customerId: { type: String, required: true },
  driverId: { type: String, required: true },
  date: Date,
  pickupTime: Date,
  dropoffTime: Date,
  distanceCovered: Number,
  sourceLocation: {
    latitude: Number,
    longitude: Number,
    addressLine: String
  },
  destinationLocation: {
    latitude: Number,
    longitude: Number,
    addressLine: String
  },
  predictedAmount: Number,
  actualAmount: Number,
  paymentStatus: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bill', BillSchema);
