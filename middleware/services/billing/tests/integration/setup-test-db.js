#!/usr/bin/env node

/**
 * Test Database Setup Script
 * 
 * This script sets up a test database with sample data for integration tests.
 * It connects to MongoDB and creates sample bills for testing.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { SSNGenerator } = require('../../src/utils/ssn-generator');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Sample data
const sampleBills = [
  {
    billingId: '123-45-6789',
    rideId: '456-78-9012',
    customerId: '234-56-7890',
    driverId: '345-67-8901',
    date: new Date(),
    pickupTime: new Date(Date.now() - 3600000), // 1 hour ago
    dropoffTime: new Date(),
    distanceCovered: 10.5,
    sourceLocation: {
      latitude: 37.7749,
      longitude: -122.4194,
      addressLine: '123 Main St, San Francisco, CA'
    },
    destinationLocation: {
      latitude: 37.3352,
      longitude: -121.8811,
      addressLine: '456 Market St, San Jose, CA'
    },
    predictedAmount: 35.50,
    actualAmount: 42.75,
    paymentStatus: 'PENDING',
    fareBreakdown: {
      baseAmount: 5.00,
      distanceAmount: 25.50,
      timeAmount: 8.00,
      surge: 1.2,
      taxes: 4.25,
      driverPayout: 34.20,
      platformFee: 8.55
    }
  },
  {
    billingId: '987-65-4321',
    rideId: '876-54-3210',
    customerId: '765-43-2109',
    driverId: '654-32-1098',
    date: new Date(Date.now() - 86400000), // 1 day ago
    pickupTime: new Date(Date.now() - 90000000), // 25 hours ago
    dropoffTime: new Date(Date.now() - 86400000), // 24 hours ago
    distanceCovered: 5.2,
    sourceLocation: {
      latitude: 37.7749,
      longitude: -122.4194,
      addressLine: '789 Oak St, San Francisco, CA'
    },
    destinationLocation: {
      latitude: 37.7833,
      longitude: -122.4167,
      addressLine: '101 Pine St, San Francisco, CA'
    },
    predictedAmount: 18.25,
    actualAmount: 20.50,
    paymentStatus: 'PAID',
    paymentDetails: {
      method: 'CREDIT_CARD',
      last4: '4242',
      transactionId: 'txn_123456789'
    },
    fareBreakdown: {
      baseAmount: 5.00,
      distanceAmount: 10.40,
      timeAmount: 3.00,
      surge: 1.0,
      taxes: 2.10,
      driverPayout: 16.40,
      platformFee: 4.10
    }
  }
];

// Connect to MongoDB and seed data
async function setupTestDB() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Get the Bill model
    const Bill = require('../../src/models/bill.model');

    // Clear existing bills
    await Bill.deleteMany({});
    console.log('✅ Cleared existing bills');

    // Insert sample bills
    await Bill.insertMany(sampleBills);
    console.log(`✅ Inserted ${sampleBills.length} sample bills`);

    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

// Run the setup
setupTestDB();