require('dotenv').config();
const connectDB = require('../config/db');
const Admin = require('../services/models/admin.model');

const seed = async () => {
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
    console.error('❌ Seeding admin failed:', err.message);
    process.exit(1);
  }
};

seed();
