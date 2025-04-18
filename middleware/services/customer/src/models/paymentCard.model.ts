// models/paymentCard.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentCard extends Document {
    customerId: string;
    paymentType: 'credit' | 'debit' | 'wallet' | 'paypal' | 'apple_pay' | 'google_pay';
    last4Digits: string;
    cardType: string;
    expiryMonth: number;
    expiryYear: number;
    tokenizedId: string;
    createdAt: Date;
    updatedAt: Date;
}

const paymentCardSchema = new Schema<IPaymentCard>({
    customerId: { type: String, required: true },
    paymentType: {
        type: String,
        enum: ['credit', 'debit', 'wallet', 'paypal', 'apple_pay', 'google_pay'],
        required: true
    },
    last4Digits: { type: String, required: true },
    cardType: { type: String, required: true },
    expiryMonth: { type: Number, required: true },
    expiryYear: { type: Number, required: true },
    tokenizedId: { type: String, required: true }
}, { timestamps: true });

export const PaymentCardModel = mongoose.model<IPaymentCard>('PaymentCard', paymentCardSchema);