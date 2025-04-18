import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import connectDB from '../config/db';
import Customer, { ICustomer } from '../services/models/customer.model';

const seed = async (): Promise<void> => {
  try {
    await connectDB();

    const newCustomer = new Customer({
      _id: '987-65-4321',
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob.smith@example.com',
      phoneNumber: '9876543210',
      address: {
        street: '200 Main St',
        city: 'San Jose',
        state: 'CA',
        zipCode: '95123'
      },
      rating: 4.8,
      creditCardId: 'cc1234567890'
    });

    await newCustomer.save();
    console.log('✅ Customer inserted');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding customer failed:', (err as Error).message);
    process.exit(1);
  }
};

seed();