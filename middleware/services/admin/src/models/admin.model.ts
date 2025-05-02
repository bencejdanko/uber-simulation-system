import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
  adminId: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  roles: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
  adminId: { type: String, required: true, unique: true }, // SSN format
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  roles: { type: [String], default: ['admin'] },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IAdmin>('Admin', AdminSchema);