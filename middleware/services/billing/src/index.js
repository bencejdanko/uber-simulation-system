const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Kafka } = require('kafkajs');
// Redis import removed for testing

// Load environment variables
dotenv.config();

// Import routes
const billRoutes = require('./routes/bill.routes');
const pricingRoutes = require('./routes/pricing.routes');

// Initialize Express app
const app = express();
const PORT = process.env.BILLING_SERVICE_PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

// Initialize Redis client for caching (if REDIS_ENABLED is set to true)
let redisClient = null;

// For testing purposes, we're completely disabling Redis
// This prevents connection errors when Redis is not available
console.log('Redis disabled for testing purposes. Continuing without Redis...');

// Mock Redis client methods that might be used in the application
const mockRedisClient = {
  get: async () => null,
  set: async () => 'OK',
  del: async () => 1,
  exists: async () => 0,
  expire: async () => 1,
  disconnect: () => {}
};

// Use the mock Redis client
redisClient = mockRedisClient;

// Initialize Kafka
const kafka = new Kafka({
  clientId: 'billing-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'billing-group' });

// Connect to Kafka and subscribe to topics
const connectKafka = async () => {
  try {
    await consumer.connect();
    console.log('✅ Kafka connected');
    
    await consumer.subscribe({ topic: 'ride-completed', fromBeginning: false });
    console.log('✅ Subscribed to ride-completed topic');
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const rideData = JSON.parse(message.value.toString());
        console.log(`Received message from ${topic}:`, rideData);
        
        // Process the completed ride and create a bill
        const billingService = require('./services/bill.service');
        await billingService.createBillFromRide(rideData);
      }
    });
  } catch (err) {
    console.error('❌ Kafka connection failed:', err.message);
    console.log('Continuing without Kafka for testing purposes...');
  }
};

// Routes
app.use('/api/bills', billRoutes); // For backward compatibility with tests
app.use('/api/pricing', pricingRoutes); // For backward compatibility with tests
app.use('/api/v1/bills', billRoutes);
app.use('/api/v1/pricing', pricingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'billing-service' });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
  
  try {
    await connectKafka();
  } catch (err) {
    console.error('Failed to connect to Kafka, continuing without it:', err.message);
  }
  
  app.listen(PORT, () => {
    console.log(`✅ Billing service running on port ${PORT}`);
    console.log(`API endpoints available at:`);
    console.log(`- http://localhost:${PORT}/api/bills`);
    console.log(`- http://localhost:${PORT}/api/pricing`);
    console.log(`- http://localhost:${PORT}/health`);
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

startServer();