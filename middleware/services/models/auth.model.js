// Use import/export syntax if using ES modules (common in modern Node.js/frontend builds)
import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// If using CommonJS (older Node.js style, default in some setups)
// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
// const { v4: uuidv4 } = require('uuid');


// The interface is removed as it's a TypeScript-only feature
// export interface IAuth extends Document { ... }

// The type parameter is removed as it's a TypeScript-only feature
// const AuthSchema = new Schema<IAuth>({ ... });
const AuthSchema = new Schema({
    // Note: Your TS interface included 'passwordHash: string;', but your TS schema definition did NOT.
    // The JavaScript code reflects the actual schema definition provided, which means 'passwordHash'
    // is not included in the schema itself.
    _id: { type: String, required: true },
    userId: {
        type: String,
        default: uuidv4, // Use the imported uuidv4 function
        unique: true,
        required: true,
        index: true,
    },
    email: { type: String, required: true },
    userType: {
        // The enum option in Mongoose Schema serves a similar purpose to the TS union type
        type: String,
        enum: ['ADMIN', 'DRIVER', 'CUSTOMER'],
        required: true
    },
    createdAt: { type: Date, default: Date.now }
    // If you intended passwordHash to be in the schema, add it here:
    // passwordHash: { type: String, required: true },
});

// The type parameter is removed as it's a TypeScript-only feature
// export default mongoose.model<IAuth>('Auth', AuthSchema);
export default mongoose.model('Auth', AuthSchema); // In JS, you just provide the name and schema

// If using CommonJS:
// module.exports = mongoose.model('Auth', AuthSchema);