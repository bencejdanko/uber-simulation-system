import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import connectDB from '../config/db';
import Ride, { IRide } from '../services/models/ride.model';

const seed = async (): Promise<void> => {
  try {
    await connectDB();

    const newRide = new Ride({
      _id: 'ride123',
      customerId: '987-65-4321',
      driverId: '123-45-6789',
      pickupLocation: {
        type: 'Point',
        coordinates: [-121.8863, 37.3382],
        addressLine: '123 Pickup St'
      },
      dropoffLocation: {
        type: 'Point',
        coordinates: [-121.9000, 37.3500],
        addressLine: '456 Dropoff Ave'
      },
      status: 'completed',
      requestTimestamp: new Date(),
      acceptTimestamp: new Date(),
      pickupTimestamp: new Date(),
      dropoffTimestamp: new Date(),
      predictedFare: 20.5,
      actualFare: 22.0,
      distance: 5.2
    });

    await newRide.save();
    console.log('✅ Ride inserted');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding ride failed:', (err as Error).message);
    process.exit(1);
  }
};

seed();