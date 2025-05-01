// Use import/export syntax if using ES modules (common in modern Node.js/frontend builds)
import mongoose, { Schema } from 'mongoose';

// If using CommonJS (older Node.js style, default in some setups)
// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// The interface is removed as it's a TypeScript-only feature
// const AdminSchema = new Schema<IAdmin>({ ... }); // In TS, type parameter helps with type checking
const AdminSchema = new Schema({
  _id: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// The type parameter is removed as it's a TypeScript-only feature
// export default mongoose.model<IAdmin>('Admin', AdminSchema); // In TS, type parameter helps with type checking
export default mongoose.model('Admin', AdminSchema); // In JS, you just provide the name and schema

// If using CommonJS:
// module.exports = mongoose.model('Admin', AdminSchema);