import mongoose, { Document, Schema } from 'mongoose';

interface ILocation {
  type: string;
  coordinates: number[];
  addressLine: string;
}

export interface IRide extends Document {
  _id: string;
  customerId: string;
  driverId: string;
  pickupLocation: ILocation;
  dropoffLocation: ILocation;
  status: string;
  requestTimestamp: Date;
  acceptTimestamp: Date;
  pickupTimestamp: Date;
  dropoffTimestamp: Date;
  predictedFare: number;
  actualFare: number;
  distance: number;
  createdAt: Date;
  updatedAt: Date;
}

const RideSchema = new Schema<IRide>({
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

export default mongoose.model<IRide>('Ride', RideSchema);