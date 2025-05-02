const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Kafka } = require('kafkajs');
const Redis = require('ioredis');

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

// Initialize Redis client for caching
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

// Initialize Kafka
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'billing-service',
  brokers: process.env.KAFKA_BROKERS.split(',') || 'localhost:9092'
});

const consumer = kafka.consumer({ groupId: 'billing-group' });

// Connect to Kafka and subscribe to topics
const connectKafka = async () => {
  try {
    await consumer.connect();
    console.log('✅ Kafka connected');
    
    await consumer.subscribe({ topic: process.env.KAFKA_RIDE_COMPLETED_TOPIC, fromBeginning: false });
    console.log(`✅ Subscribed to ${KAFKA_RIDE_COMPLETED_TOPIC} topic`);
    
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
  }
};

// Routes
app.use('/api/v1/bills', billRoutes);
app.use('/api/v1/pricing', pricingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'billing-service' });
});

// Start server
const startServer = async () => {
  await connectDB();
  await connectKafka();
  
  app.listen(PORT, () => {
    console.log(`✅ Billing service running on port ${PORT}`);
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