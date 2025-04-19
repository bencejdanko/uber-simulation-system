import mongoose, { Document, Schema } from 'mongoose';

export interface IAuth extends Document {
    _id: string;
    userId: string;
    email: string;
    passwordHash: string;
    userType: 'ADMIN' | 'DRIVER' | 'CUSTOMER';
}

const AuthSchema = new Schema<IAuth>({
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    email: { type: String, required: true },
    userType: { 
        type: String, 
        enum: ['ADMIN', 'DRIVER', 'CUSTOMER'], 
        required: true 
    },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IAuth>('Auth', AuthSchema);