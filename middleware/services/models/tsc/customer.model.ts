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

export default mongoose.model<ICustomer>('Customer', CustomerSchema);