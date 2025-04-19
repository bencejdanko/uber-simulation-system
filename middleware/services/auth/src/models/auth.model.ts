import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Define the structure of a User Credential document
export interface IAuth extends Document {
    userId: string; // Primary internal ID
    email: string;
    hashedPassword: string;
    userType: 'CUSTOMER' | 'DRIVER' | 'ADMIN'; // Use string literal types
    // ssn?: string; // Optional, encrypted SSN if required
    // activeRefreshTokenId?: string; // Optional for stateful refresh tokens
    createdAt: Date;
    updatedAt: Date;
}

const AuthSchema = new Schema<IAuth>({
    userId: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true,
        index: true,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    hashedPassword: { type: String, required: true },
    userType: { type: String, required: true, enum: ['CUSTOMER', 'DRIVER', 'ADMIN'] },
    // ssn: { type: String, unique: true, sparse: true, required: false /* Add encryption logic */ },
    // activeRefreshTokenId: { type: String, index: true }
}, { timestamps: true });

export const AuthModel = model<IAuth>('Auth', AuthSchema);