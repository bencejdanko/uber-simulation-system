// models/customer.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
    externalCustomerId: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
    };
    role: 'customer' | 'admin';
    verified: boolean;
    paymentCardId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>({
    externalCustomerId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    phone: { type: String },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
    },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    verified: { type: Boolean, default: false },
    paymentCardId: { type: mongoose.Types.ObjectId, ref: 'PaymentCard' }
}, { timestamps: true });

export const CustomerModel = mongoose.model<ICustomer>('Customer', customerSchema);