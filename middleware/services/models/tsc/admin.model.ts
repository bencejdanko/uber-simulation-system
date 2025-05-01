import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
  _id: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IAdmin>('Admin', AdminSchema);