import mongoose, { Schema, Document } from 'mongoose';

export interface IRide extends Document {
  _id: string;
  customerId: string;
  driverId?: string;
  status: 'REQUESTED' | 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  pickupLocation: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  dropoffLocation: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  vehicleType: 'STANDARD' | 'PREMIUM' | 'LUXURY';
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'PAYPAL';
  estimatedFare?: number;
  actualFare?: number;
  createdAt: Date;
  updatedAt: Date;
  cancellationReason?: string;
}

const RideSchema: Schema = new Schema({
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

export const Ride = mongoose.model<IRide>('Ride', RideSchema);