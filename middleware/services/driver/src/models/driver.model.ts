import mongoose, { Schema, Document } from 'mongoose';

// Driver interface
export interface IDriver extends Document {
  externalDriverId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'driver';
  status: 'available' | 'busy' | 'offline';
  vehicle?: {
    type: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const driverSchema = new Schema<IDriver>(
  {
    externalDriverId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['driver'],
      default: 'driver',
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'offline',
    },
    vehicle: {
      type: {
        type: String,
        enum: ['economy', 'premium', 'suv', 'xl'],
      },
      make: String,
      model: String,
      year: Number,
      licensePlate: String,
    },
    rating: {
      type: Number,
      min: 1.0,
      max: 5.0,
      default: 5.0,
    },
  },
  { timestamps: true }
);

// Create and export the model
export const DriverModel = mongoose.model<IDriver>('Driver', driverSchema);

export default DriverModel;