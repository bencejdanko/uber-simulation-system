// Use import/export syntax if using ES modules (common in modern Node.js/frontend builds)
import mongoose, { Schema } from 'mongoose';

// If using CommonJS (older Node.js style, default in some setups)
// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;


// The interface is removed as it's a TypeScript-only feature
// export interface IReview extends Document { ... }

// The type parameter is removed as it's a TypeScript-only feature
// const ReviewSchema = new Schema<IReview>({ ... });
const ReviewSchema = new Schema({
  _id: { type: String, required: true }, // Explicit type object
  reviewerId: String, // Shorthand type
  revieweeId: String, // Shorthand type
  reviewerType: String, // Shorthand type
  revieweeType: String, // Shorthand type
  rating: Number, // Shorthand type
  comment: String, // Shorthand type
  timestamp: { type: Date, default: Date.now } // Explicit type object with default
});

// Optional: If you want to automatically manage 'createdAt' and 'updatedAt'
// like in previous examples, you'd add the timestamps option.
// However, your current schema only has a 'timestamp' field.
// If 'timestamp' is meant to be the creation time, you could rename it to 'createdAt'
// and use the timestamps option for cleaner management.
// Example using timestamps (would require removing the manual timestamp field):
// const ReviewSchema = new Schema({
//   _id: { type: String, required: true },
//   reviewerId: String,
//   revieweeId: String,
//   reviewerType: String,
//   revieweeType: String,
//   rating: Number,
//   comment: String,
//   // createdAt and updatedAt managed automatically
// }, { timestamps: true });


// The type parameter is removed as it's a TypeScript-only feature
// export default mongoose.model<IReview>('Review', ReviewSchema);
export default mongoose.model('Review', ReviewSchema); // In JS, you just provide the name and schema

// If using CommonJS:
// module.exports = mongoose.model('Review', ReviewSchema);