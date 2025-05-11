import mongoose, { Schema } from 'mongoose';

const RideSchema = new Schema({
  customerId: { type: String, required: true },
  driverId: { type: String },
  status: {
    type: String,
    enum: ['REQUESTED', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'REQUESTED'
  },
  pickupLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  dropoffLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  vehicleType: {
    type: String,
    enum: ['STANDARD', 'PREMIUM', 'LUXURY'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CREDIT_CARD', 'PAYPAL'],
    required: true
  },
  estimatedFare: { type: Number },
  actualFare: { type: Number },
  cancellationReason: { type: String }
}, {
  timestamps: true
});

// Create geospatial index for pickup location
RideSchema.index({ 'pickupLocation': '2dsphere' });

// Create compound index for status and driverId
RideSchema.index({ status: 1, driverId: 1 });

// Create compound index for status and customerId
RideSchema.index({ status: 1, customerId: 1 });

const Ride = mongoose.model('Ride', RideSchema);

export default Ride;
