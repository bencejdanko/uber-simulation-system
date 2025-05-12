const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BillSchema = new mongoose.Schema({
  rideId: {
    type: Schema.Types.ObjectId,
    ref: 'Ride',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  amount: {
    type: Number,
    required: true,
  },
  customer: {
    type: String,
    required: true,
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  driver: {
    type: String,
    required: true,
  },
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
  },
  source: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CREDIT_CARD', 'WALLET'],
    default: 'CASH',
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a virtual 'id' field for API compatibility
BillSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Always include virtuals when converting to JSON
BillSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Bill', BillSchema); 