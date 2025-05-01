// Use import/export syntax if using ES modules (common in modern Node.js/frontend builds)
import mongoose, { Schema } from 'mongoose';

// If using CommonJS (older Node.js style, default in some setups)
// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;


// The interfaces are removed as they are TypeScript-only features
// interface ICustomerAddress { ... }
// export interface ICustomer extends Document { ... }

// The type parameter is removed as it's a TypeScript-only feature
// const CustomerSchema = new Schema<ICustomer>({ ... });
const CustomerSchema = new Schema({
  // Note: The regex match on _id seems unusual for a typical Mongoose ID,
  // but the conversion preserves your original schema definition.
  _id: { type: String, match: /^\d{3}-\d{2}-\d{4}$/, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: {
    // Mongoose handles nested objects by defining them directly in the schema
    street: { type: String }, // Added explicit type object for consistency
    city: { type: String },
    state: { type: String },
    // Note: zipCode was optional (?) in interface, but schema defines match regex
    zipCode: { type: String, match: /^\d{5}(-\d{4})?$/ }
  },
  rating: { type: Number, default: 5.0 }, // Default value is handled by Mongoose in JS
  creditCardId: { type: String }, // Added explicit type object
  createdAt: { type: Date, default: Date.now }, // Manual default
  updatedAt: { type: Date, default: Date.now } // Manual default
});

// Optional: Add timestamps option for automatic `createdAt` and `updatedAt` management
// This is the standard Mongoose way and often preferred over manual defaults.
// BillSchema.set('timestamps', true);
// Or pass as option: new Schema({}, { timestamps: true });
// If using `timestamps: true`, you would remove the individual `createdAt` and `updatedAt` fields from the schema definition object.


// The type parameter is removed as it's a TypeScript-only feature
// export default mongoose.model<ICustomer>('Customer', CustomerSchema);
export default mongoose.model('Customer', CustomerSchema); // In JS, you just provide the name and schema

// If using CommonJS:
// module.exports = mongoose.model('Customer', CustomerSchema);