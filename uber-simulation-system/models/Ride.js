const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RideSchema = new mongoose.Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'Driver',
  },
  customerName: {
    type: String,
    required: true,
  },
  driverName: {
    type: String,
  },
  requestTime: {
    type: Date,
    default: Date.now,
  },
  pickupTime: {
    type: Date,
  },
  dropoffTime: {
    type: Date,
  },
  pickup: {
    type: String,
    required: true,
  },
  pickupLocation: {
    type: {
      type: String,
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  destination: {
    type: String,
    required: true,
  },
  destinationLocation: {
    type: {
      type: String,
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  status: {
    type: String,
    enum: ['REQUESTED', 'SCHEDULED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'REQUESTED',
  },
  fare: {
    type: Number,
  },
  estimatedFare: {
    type: Number,
  },
  distanceKm: {
    type: Number,
  },
  estimatedDistance: {
    type: Number,
  },
  durationMinutes: {
    type: Number,
  },
  estimatedDuration: {
    type: Number,
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CREDIT_CARD', 'WALLET'],
    default: 'CASH',
  },
  cancellationReason: {
    type: String,
  },
  notes: {
    type: String,
  },
  scheduledTime: {
    type: Date,
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

// Create a virtual 'rideId' field for API compatibility
RideSchema.virtual('rideId').get(function() {
  return this._id.toString();
});

// Create indexes for geospatial queries
RideSchema.index({ pickupLocation: '2dsphere' });
RideSchema.index({ destinationLocation: '2dsphere' });

// Always include virtuals when converting to JSON
RideSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Ride', RideSchema); 