import { Schema, model, Document } from 'mongoose';

// Define the structure of a User Credential document
export interface IAuth extends Document {
    userId: string; // Primary internal ID, now expected in SSN format
    email: string;
    hashedPassword: string;
    userType: 'CUSTOMER' | 'DRIVER' | 'ADMIN'; // Use string literal types
    createdAt: Date;
    updatedAt: Date;
}

const AuthSchema = new Schema<IAuth>({
    userId: {
        type: String,
        match: /^\d{3}-\d{2}-\d{4}$/, // Add SSN format validation
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