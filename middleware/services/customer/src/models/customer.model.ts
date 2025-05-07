// // models/customer.model.ts
// import mongoose, { Schema, Document } from 'mongoose';

// export interface ICustomer extends Document {
//     _id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//     password: string;
//     phone?: string;
//     address: {
//         street: string;
//         city: string;
//         state: string;
//         zipCode: string;
//     };
//     role: 'customer' | 'admin';
//     verified: boolean;
//     paymentCardId?: mongoose.Types.ObjectId;
//     createdAt: Date;
//     updatedAt: Date;
// }

// const customerSchema = new Schema<ICustomer>({
//     externalCustomerId: { type: String, required: true, unique: true },
//     firstName: { type: String, required: true },
//     lastName: { type: String, required: true },
//     email: { type: String, required: true, unique: true, lowercase: true },
//     password: { type: String, required: true, select: false },
//     phone: { type: String },
//     address: {
//         street: { type: String, required: true },
//         city: { type: String, required: true },
//         state: { type: String, required: true },
//         zipCode: { type: String, required: true },
//     },
//     role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
//     verified: { type: Boolean, default: false },
//     paymentCardId: { type: mongoose.Types.ObjectId, ref: 'PaymentCard' }
// }, { timestamps: true });

// export const CustomerModel = mongoose.model<ICustomer>('Customer', customerSchema);

import mongoose, { Document, Schema } from 'mongoose';

interface ICustomerAddress {
  street: string;
  city: string;
  state: string;
  zipCode?: string;
}

export interface ICustomer extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: ICustomerAddress;
  rating: number;
  creditCardId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  _id: { type: String, match: /^\d{3}-\d{2}-\d{4}$/, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: { type: String, match: /^\d{5}(-\d{4})?$/ }
  },
  rating: { type: Number, default: 5.0 },
  creditCardId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const CustomerModel = mongoose.model<ICustomer>('Customer', CustomerSchema);