import mongoose, { Schema, Document } from 'mongoose';

// Customer interface
export interface ICustomer extends Document {
  externalCustomerId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'customer';
  paymentMethods?: {
    id: string;
    type: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';
    last4?: string;
    isDefault: boolean;
  }[];
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const customerSchema = new Schema<ICustomer>(
  {
    externalCustomerId: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{3}-\d{2}-\d{4}$/, // SSN Format validation
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['customer'],
      default: 'customer',
      required: true,
    },
    paymentMethods: [
      {
        id: String,
        type: {
          type: String,
          enum: ['credit_card', 'paypal', 'apple_pay', 'google_pay'],
        },
        last4: String,
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    rating: {
      type: Number,
      min: 1.0,
      max: 5.0,
      default: 5.0,
    },
  },
  { timestamps: true }
);

// Create and export the model
export const CustomerModel = mongoose.model<ICustomer>('Customer', customerSchema);

export default CustomerModel;