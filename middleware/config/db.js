const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // ✅ loads from one level up

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log("Connecting using URI:", uri); // Debug

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
