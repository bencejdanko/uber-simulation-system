import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'DRIVER' | 'ADMIN';
  location?: {
    latitude: number;
    longitude: number;
  };
  isAvailable?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ['CUSTOMER', 'DRIVER', 'ADMIN'],
    required: true
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  isAvailable: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Create geospatial index for driver location
UserSchema.index({ 'location': '2dsphere' });

// Create compound index for role and availability
UserSchema.index({ role: 1, isAvailable: 1 });

export const User = mongoose.model<IUser>('User', UserSchema); 