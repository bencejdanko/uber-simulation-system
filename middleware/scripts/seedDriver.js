// ✅ Load environment variables
require('dotenv').config();

const connectDB = require('../config/db');
const Driver = require('../services/models/driver.model');

const seed = async () => {
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
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
