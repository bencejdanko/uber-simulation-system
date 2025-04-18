// ✅ Load environment variables
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import connectDB from '../config/db';
import Driver, { IDriver } from '../services/models/driver.model';

const seed = async (): Promise<void> => {
  try {
    console.log("🔌 Connecting using:", process.env.MONGODB_URI); // Debug check

    await connectDB();

    const newDriver = new Driver({
      _id: '123-45-6789',
      firstName: 'Alice',
      lastName: 'Walker',
      email: 'alice.walker@example.com',
      phoneNumber: '1234567890',
      address: {
        street: '100 Main St',
        city: 'San Jose',
        state: 'CA',
        zipCode: '95123'
      },
      carDetails: {
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        color: 'Black',
        licensePlate: 'BOOM123'
      },
      currentLocation: {
        coordinates: [-121.8863, 37.3382],
        timestamp: new Date()
      }
    });

    await newDriver.save();
    console.log('✅ Driver inserted successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', (err as Error).message);
    process.exit(1);
  }
};

seed();