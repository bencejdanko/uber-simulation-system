// Use import/export syntax if using ES modules (common in modern Node.js/frontend builds)
import mongoose, { Schema } from 'mongoose';

// If using CommonJS (older Node.js style, default in some setups)
// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;


// The interfaces are removed as they are TypeScript-only features
// interface IDriverAddress { ... }
// interface ICarDetails { ... }
// interface IIntroduction { ... }
// interface ILocation { ... }
// export interface IDriver extends Document { ... }

// The type parameter is removed as it's a TypeScript-only feature
// const DriverSchema = new Schema<IDriver>({ ... });
const DriverSchema = new Schema({
  // Note: The regex match on _id seems unusual for a typical Mongoose ID,
  // but the conversion preserves your original schema definition.
  _id: { type: String, match: /^\d{3}-\d{2}-\d{4}$/, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, match: /.+@.+\..+/ },
  phoneNumber: { type: String, required: true },
  address: {
    // Mongoose handles nested objects by defining them directly in the schema
    street: { type: String }, // Explicit type object for consistency
    city: { type: String },
    state: { type: String },
    // Note: zipCode was optional (?) in interface, but schema defines match regex
    zipCode: { type: String, match: /^\d{5}(-\d{4})?$/ }
  },
  carDetails: {
    make: { type: String }, // Explicit type object
    model: { type: String },
    year: { type: Number },
    color: { type: String },
    licensePlate: { type: String }
  },
  rating: { type: Number, default: 5.0 }, // Default value handled by Mongoose
  introduction: {
    imageUrl: { type: String }, // Explicit type object
    videoUrl: { type: String }
  },
  currentLocation: {
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
    timestamp: { type: Date, default: Date.now } // Timestamp for when location was recorded
  },
  createdAt: { type: Date, default: Date.now }, // Manual default
  updatedAt: { type: Date, default: Date.now } // Manual default
});

// Optional: Add timestamps option for automatic `createdAt` and `updatedAt` management
// This is the standard Mongoose way and often preferred over manual defaults.
// DriverSchema.set('timestamps', true);
// Or pass as option: new Schema({}, { timestamps: true });
// If using `timestamps: true`, you would remove the individual `createdAt` and `updatedAt` fields from the schema definition object.

// The type parameter is removed as it's a TypeScript-only feature
// export default mongoose.model<IDriver>('Driver', DriverSchema);
export default mongoose.model('Driver', DriverSchema); // In JS, you just provide the name and schema

// If using CommonJS:
// module.exports = mongoose.model('Driver', DriverSchema);