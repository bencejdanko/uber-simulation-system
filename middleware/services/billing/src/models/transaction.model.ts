import mongoose, { Schema, Document } from 'mongoose';

// Transaction interface
export interface ITransaction extends Document {
  transactionId: string;
  rideId: string;
  customerId: string;
  driverId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: {
    type: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';
    last4?: string;
  };
  breakdown: {
    baseAmount: number;
    distanceAmount: number;
    timeAmount: number;
    surge?: number;
    taxes: number;
    driverPayout: number;
    platformFee: number;
  };
  createdAt: Date;
  completedAt?: Date;
}

// Define the schema
const transactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{3}-\d{2}-\d{4}$/, // SSN Format validation
    },
    rideId: {
      type: String,
      required: true,
      index: true,
      match: /^\d{3}-\d{2}-\d{4}$/, // SSN Format validation
    },
    customerId: {
      type: String,
      required: true,
      index: true,
      match: /^\d{3}-\d{2}-\d{4}$/, // SSN Format validation
    },
    driverId: {
      type: String,
      required: true,
      index: true,
      match: /^\d{3}-\d{2}-\d{4}$/, // SSN Format validation
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: {
        type: String,
        enum: ['credit_card', 'paypal', 'apple_pay', 'google_pay'],
        required: true,
      },
      last4: String,
    },
    breakdown: {
      baseAmount: {
        type: Number,
        required: true,
      },
      distanceAmount: {
        type: Number,
        required: true,
      },
      timeAmount: {
        type: Number,
        required: true,
      },
      surge: Number,
      taxes: {
        type: Number,
        required: true,
      },
      driverPayout: {
        type: Number,
        required: true,
      },
      platformFee: {
        type: Number,
        required: true,
      },
    },
    completedAt: Date,
  },
  { timestamps: true }
);

// Create and export the model
export const TransactionModel = mongoose.model<ITransaction>('Transaction', transactionSchema);

export default TransactionModel;