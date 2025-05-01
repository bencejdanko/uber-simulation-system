// Use import/export syntax if using ES modules (common in modern Node.js/frontend builds)
import mongoose, { Schema } from 'mongoose';

// If using CommonJS (older Node.js style, default in some setups)
// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;


// The interfaces are removed as they are TypeScript-only features
// interface ILocation { ... }
// export interface IRide extends Document { ... }

// The type parameter is removed as it's a TypeScript-only feature
// const RideSchema = new Schema<IRide>({ ... });
const RideSchema = new Schema({
  _id: { type: String, required: true }, // Explicit type object
  customerId: { type: String, required: true }, // Explicit type object
  driverId: { type: String, required: true }, // Explicit type object
  pickupLocation: {
    // Standard GeoJSON Point schema structure for Mongoose
    type: {
      type: String,
      enum: ['Point'], // Restricts the 'type' field value
      default: 'Point', // Sets the default value to 'Point'
      required: true // Added required, as type is mandatory for GeoJSON
    },
    coordinates: {
      type: [Number], // Array of Numbers [longitude, latitude]
      index: '2dsphere', // Creates a 2dsphere index for geospatial queries
      required: true // Coordinates are mandatory for a Point
    },
    addressLine: { type: String } // Explicit type object
  },
  dropoffLocation: {
    // Standard GeoJSON Point schema structure for Mongoose
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true // Added required
    },
    coordinates: {
      type: [Number],
      index: '2dsphere', // Index is often useful here too if you query dropoff locations
      required: true // Added required
    },
    addressLine: { type: String }
  },
  status: { type: String }, // Explicit type object for consistency
  requestTimestamp: { type: Date }, // Explicit type object
  acceptTimestamp: { type: Date },
  pickupTimestamp: { type: Date },
  dropoffTimestamp: { type: Date },
  predictedFare: { type: Number }, // Explicit type object
  actualFare: { type: Number },
  distance: { type: Number },
  createdAt: { type: Date, default: Date.now }, // Manual default
  updatedAt: { type: Date, default: Date.now } // Manual default
});

// Optional: Add timestamps option for automatic `createdAt` and `updatedAt` management
// This is the standard Mongoose way and often preferred over manual defaults.
// RideSchema.set('timestamps', true);
// Or pass as option: new Schema({}, { timestamps: true });
// If using `timestamps: true`, you would remove the individual `createdAt` and `updatedAt` fields from the schema definition object.


// The type parameter is removed as it's a TypeScript-only feature
// export default mongoose.model<IRide>('Ride', RideSchema);
export default mongoose.model('Ride', RideSchema); // In JS, you just provide the name and schema

// If using CommonJS:
// module.exports = mongoose.model('Ride', RideSchema);