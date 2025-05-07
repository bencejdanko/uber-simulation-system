// src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  if (process.env.NODE_ENV !== 'test') {    // For 'npm test', I am using MongoMemoryServer
    mongoose.connect(process.env.MONGODB_URI, { 
    }).then(() => {
      console.log(`✅ MongoDB connected on Port: ${process.env.PORT}`);
    }).catch((err) => {
      console.error('❌ MongoDB connection error:', err);
    });
  }
};

module.exports = connectDB;
