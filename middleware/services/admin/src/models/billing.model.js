const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  addressLine: { type: String }
});

const billSchema = new mongoose.Schema({
  billingId: { type: String, required: true, unique: true },
  rideId: { type: String, required: true },
  customerId: { type: String, required: true },
  driverId: { type: String, required: true },
  date: { type: String, required: true },
  pickupTime: { type: String, required: true },
  dropoffTime: { type: String, required: true },
  distanceCovered: { type: Number, required: true },
  sourceLocation: { type: locationSchema, required: true },
  destinationLocation: { type: locationSchema, required: true },
  predictedAmount: { type: Number, required: true },
  actualAmount: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['PENDING', 'PAID', 'FAILED', 'VOID'], 
    default: 'PENDING' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
