import mongoose, { Document, Schema } from 'mongoose';

// Define interface for driver document
interface IDriverAddress {
  street: string;
  city: string;
  state: string;
  zipCode?: string;
}

interface ICarDetails {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
}

interface IIntroduction {
  imageUrl?: string;
  videoUrl?: string;
}

interface ILocation {
  type: string;
  coordinates: number[];
  timestamp: Date;
}

export interface IDriver extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: IDriverAddress;
  carDetails: ICarDetails;
  rating: number;
  introduction: IIntroduction;
  currentLocation: ILocation;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>({
  _id: { type: String, match: /^\d{3}-\d{2}-\d{4}$/, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, match: /.+@.+\..+/ },
  phoneNumber: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: { type: String, match: /^\d{5}(-\d{4})?$/ }
  },
  carDetails: {
    make: String,
    model: String,
    year: Number,
    color: String,
    licensePlate: String
  },
  rating: { type: Number, default: 5.0 },
  introduction: {
    imageUrl: String,
    videoUrl: String
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    timestamp: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const DriverModel = mongoose.model<IDriver>('Driver', DriverSchema);