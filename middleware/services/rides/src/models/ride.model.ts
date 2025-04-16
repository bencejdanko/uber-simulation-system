import mongoose, { Schema, Document } from 'mongoose';

// Ride interface
export interface IRide extends Document {
  rideId: string;
  customerId: string;
  driverId?: string;
  status: 'requested' | 'driver_assigned' | 'in_progress' | 'completed' | 'cancelled';
  pickup: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  requestedVehicleType?: string;
  estimatedDistance?: number; // in kilometers
  estimatedDuration?: number; // in seconds
  estimatedPrice?: number;
  actualDistance?: number;
  actualDuration?: number;
  requestedAt: Date;
  driverAssignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: 'customer' | 'driver' | 'system';
  cancelReason?: string;
  rating?: {
    customerToDriver?: number;
    driverToCustomer?: number;
    customerComment?: string;
    driverComment?: string;
  };
}

// Define the schema
const rideSchema = new Schema<IRide>(
  {
    rideId: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    driverId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ['requested', 'driver_assigned', 'in_progress', 'completed', 'cancelled'],
      required: true,
      default: 'requested',
    },
    pickup: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
      address: String,
    },
    destination: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
      address: String,
    },
    requestedVehicleType: String,
    estimatedDistance: Number,
    estimatedDuration: Number,
    estimatedPrice: Number,
    actualDistance: Number,
    actualDuration: Number,
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    driverAssignedAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancelledBy: {
      type: String,
      enum: ['customer', 'driver', 'system'],
    },
    cancelReason: String,
    rating: {
      customerToDriver: {
        type: Number,
        min: 1,
        max: 5,
      },
      driverToCustomer: {
        type: Number,
        min: 1,
        max: 5,
      },
      customerComment: String,
      driverComment: String,
    },
  },
  { timestamps: true }
);

// Create and export the model
export const RideModel = mongoose.model<IRide>('Ride', rideSchema);

export default RideModel;