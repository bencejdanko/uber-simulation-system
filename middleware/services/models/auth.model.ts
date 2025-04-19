import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IAuth extends Document {
    _id: string;
    userId: string;
    email: string;
    passwordHash: string;
    userType: 'ADMIN' | 'DRIVER' | 'CUSTOMER';
}

const AuthSchema = new Schema<IAuth>({
    _id: { type: String, required: true },
    userId: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true,
        index: true,
    },
    email: { type: String, required: true },
    userType: {
        type: String,
        enum: ['ADMIN', 'DRIVER', 'CUSTOMER'],
        required: true
    },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IAuth>('Auth', AuthSchema);