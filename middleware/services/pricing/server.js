const express = require('express');
const cors = require('cors');
const { Kafka } = require('kafkajs');
const dynamicPricing = require('./pricing-model');
require('dotenv').config();

// Initialize Express app
const app = express();
const port = process.env.PRICING_SERVICE_PORT || 8005;

// Kafka client for messaging
const kafka = new Kafka({
  clientId: 'pricing-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'pricing-service-group' });

// Middleware
app.use(cors());
app.use(express.json());

// Endpoints
app.post('/api/v1/pricing/estimate', async (req, res) => {
  try {
    const rideDetails = req.body;
    
    // Validate required fields
    const requiredFields = ['pickupLocation', 'dropoffLocation', 'distance', 'estimatedDuration'];
    const missingFields = requiredFields.filter(field => !rideDetails[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Set default values if not provided
    if (!rideDetails.pickupTime) {
      rideDetails.pickupTime = new Date();
    }
    
    if (!rideDetails.passengerCount) {
      rideDetails.passengerCount = 1;
    }
    
    // Calculate price using the dynamic pricing algorithm
    const pricing = await dynamicPricing.calculatePrice(rideDetails);
    
    // For demonstration, log the fare estimate to Kafka
    await producer.send({
      topic: 'fare.estimated',
      messages: [
        { 
          key: 'fare_estimate',
          value: JSON.stringify({
            pricing,
            rideDetails,
            timestamp: new Date().toISOString()
          })
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('Error estimating price:', error);
    return res.status(500).json({
      success: false,
      error: 'Error calculating fare estimate'
    });
  }
});

// Get demand information for a specific area
app.get('/api/v1/pricing/demand', async (req, res) => {
  try {
    const { area, radius = 5 } = req.query;
    
    if (!area) {
      return res.status(400).json({
        success: false,
        error: 'Area parameter is required'
      });
    }
    
    const demand = await dynamicPricing.demandPricing.getCurrentDemand(area, radius);
    const surgeMultiplier = dynamicPricing.demandPricing.getSurgeMultiplier(demand.ratio);
    
    return res.status(200).json({
      success: true,
      data: {
        area,
        radius,
        demand,
        surgeMultiplier
      }
    });
  } catch (error) {
    console.error('Error getting demand information:', error);
    return res.status(500).json({
      success: false,
      error: 'Error retrieving demand information'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'pricing-service' });
});

// Kafka setup
const setupKafka = async () => {
  await producer.connect();
  console.log('Kafka producer connected');

  await consumer.connect();
  console.log('Kafka consumer connected');

  await consumer.subscribe({ 
    topics: [
      'ride.requested',
      'ride.completed'
    ] 
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const payload = JSON.parse(message.value.toString());
      console.log(`Received message from topic ${topic}:`, payload);

      // Process messages based on topic
      switch(topic) {
        case 'ride.requested':
          // Handle ride request and produce fare estimate
          if (payload.rideDetails) {
            try {
              const pricing = await dynamicPricing.calculatePrice(payload.rideDetails);
              
              await producer.send({
                topic: 'fare.calculated',
                messages: [
                  { 
                    key: payload.rideId || 'fare_calculation',
                    value: JSON.stringify({
                      rideId: payload.rideId,
                      pricing,
                      timestamp: new Date().toISOString()
                    })
                  }
                ]
              });
            } catch (error) {
              console.error('Error processing ride request:', error);
            }
          }
          break;
        
        case 'ride.completed':
          // Process completed ride for improving price prediction model
          // This would be where you feed data back for model improvement
          break;
      }
    },
  });
};

// Start server
const startServer = async () => {
  try {
    await setupKafka();
    app.listen(port, () => {
      console.log(`Pricing service running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await producer.disconnect();
  await consumer.disconnect();
  process.exit(0);
});

startServer(); 