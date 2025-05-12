const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const { Kafka } = require('kafkajs');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 8001;
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST']
  }
});

// Redis client for caching
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost', 
  port: process.env.REDIS_PORT || 6379
});

// Kafka client for messaging
const kafka = new Kafka({
  clientId: 'admin-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'admin-service-group' });

// Import WebSocket service and initialize it with io
const { initializeWebSocket, sendDashboardUpdate } = require('./services/websocket.service');
initializeWebSocket(io);

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'admin-service' });
});

// Import routes
const statisticsRoutes = require('./routes/statistics.routes');
const driversRoutes = require('./routes/drivers.routes');
const customersRoutes = require('./routes/customers.routes');
const billingRoutes = require('./routes/billing.routes');
const ridesRoutes = require('./routes/rides.routes');
const authRoutes = require('./routes/auth.routes');

// Define routes
app.use('/api/v1/admin/statistics', statisticsRoutes);
app.use('/api/v1/admin/drivers', driversRoutes);
app.use('/api/v1/admin/customers', customersRoutes);
app.use('/api/v1/admin/bills', billingRoutes);
app.use('/api/v1/admin/rides', ridesRoutes);
app.use('/api/v1/auth', authRoutes);

// Import Kafka service and initialize it with consumer
const { initializeKafkaConsumer } = require('./services/kafka.service');

// Start MongoDB connection and server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/uber_simulation', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Start Kafka consumer
      await initializeKafkaConsumer(consumer)
        .catch(err => console.warn('Kafka consumer error, continuing without Kafka:', err));
      
      // Start server
      server.listen(port, () => {
        console.log(`Admin service running on port ${port}`);
        
        // Schedule a sendDashboardUpdate every 10 seconds to show WebSocket is working
        setInterval(() => {
          sendDashboardUpdate('overview', {
            totalRides: 4827 + Math.floor(Math.random() * 10),
            totalDrivers: 321,
            totalCustomers: 1253,
            totalRevenue: 78659.45 + Math.floor(Math.random() * 100),
            activeDrivers: 298 + Math.floor(Math.random() * 5),
            activeCustomers: 876 + Math.floor(Math.random() * 5),
            timestamp: new Date().toISOString()
          });
        }, 10000);
      });
    } catch (error) {
      console.error('Service initialization error:', error);
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    console.log('Starting server without MongoDB...');
    
    server.listen(port, () => {
      console.log(`Admin service running on port ${port} (without MongoDB)`);
    });
  });

// Export the io instance for use in other files
module.exports = { io, sendDashboardUpdate }; 