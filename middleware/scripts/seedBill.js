require('dotenv').config();
const connectDB = require('../config/db');
const Bill = require('../services/models/bill.model');

const seed = async () => {
  try {
    await connectDB();

    const newBill = new Bill({
      _id: 'bill123',
      rideId: 'ride123',
      customerId: '987-65-4321',
      driverId: '123-45-6789',
      date: new Date(),
      pickupTime: new Date(),
      dropoffTime: new Date(),
      distanceCovered: 5.2,
      sourceLocation: {
        latitude: 37.3382,
        longitude: -121.8863,
        addressLine: '123 Pickup St'
      },
      destinationLocation: {
        latitude: 37.3500,
        longitude: -121.9000,
        addressLine: '456 Dropoff Ave'
      },
      predictedAmount: 20.5,
      actualAmount: 22.0,
      paymentStatus: 'Paid'
    });

    await newBill.save();
    console.log('✅ Bill inserted');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding bill failed:', err.message);
    process.exit(1);
  }
};

seed();
