import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import connectDB from '../config/db';
import Admin, { IAdmin } from '../services/models/admin.model';

const seed = async (): Promise<void> => {
  try {
    await connectDB();

    const newAdmin = new Admin({
      _id: 'admin001',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com'
    });

    await newAdmin.save();
    console.log('✅ Admin inserted');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding admin failed:', (err as Error).message);
    process.exit(1);
  }
};

seed();