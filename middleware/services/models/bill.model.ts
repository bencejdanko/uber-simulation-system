import mongoose, { Document, Schema } from 'mongoose';

interface ILocation {
  latitude: number;
  longitude: number;
  addressLine: string;
}

export interface IBill extends Document {
  _id: string;
  rideId: string;
  customerId: string;
  driverId: string;
  date: Date;
  pickupTime: Date;
  dropoffTime: Date;
  distanceCovered: number;
  sourceLocation: ILocation;
  destinationLocation: ILocation;
  predictedAmount: number;
  actualAmount: number;
  paymentStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

const BillSchema = new Schema<IBill>({
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

export default mongoose.model<IBill>('Bill', BillSchema);