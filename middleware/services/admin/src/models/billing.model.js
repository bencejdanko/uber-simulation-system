// Use import/export syntax if using ES modules (common in modern Node.js/frontend builds)
import mongoose, { Schema } from 'mongoose';

// If using CommonJS (older Node.js style, default in some setups)
// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;


// The interfaces are removed as they are TypeScript-only features
// interface ILocation { ... }
// export interface IBill extends Document { ... }

// The type parameter is removed as it's a TypeScript-only feature
// const BillSchema = new Schema<IBill>({ ... });
const BillSchema = new Schema({
  _id: { type: String, required: true },
  rideId: { type: String, required: true },
  customerId: { type: String, required: true },
  driverId: { type: String, required: true },
  date: { type: Date }, // Explicit type for clarity, though shorthand `Date` also works
  pickupTime: { type: Date },
  dropoffTime: { type: Date },
  distanceCovered: { type: Number }, // Explicit type
  sourceLocation: {
    // Mongoose handles nested objects by defining them directly in the schema
    latitude: { type: Number, required: true }, // Added required based on typical use, though not in your original schema
    longitude: { type: Number, required: true },// Added required
    addressLine: { type: String }
  },
  destinationLocation: {
    latitude: { type: Number, required: true }, // Added required
    longitude: { type: Number, required: true }, // Added required
    addressLine: { type: String }
  },
  predictedAmount: { type: Number },
  actualAmount: { type: Number },
  paymentStatus: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now } // Typically, you'd add `timestamps: true` option to schema for auto-management
});

// Optional: Add timestamps option for automatic `createdAt` and `updatedAt` management
// BillSchema.set('timestamps', true);
// If using `timestamps: true`, you can remove the individual `createdAt` and `updatedAt` fields from the schema definition object.

// The type parameter is removed as it's a TypeScript-only feature
// export default mongoose.model<IBill>('Bill', BillSchema);
export default mongoose.model('Bill', BillSchema); // In JS, you just provide the name and schema

// If using CommonJS:
// module.exports = mongoose.model('Bill', BillSchema);