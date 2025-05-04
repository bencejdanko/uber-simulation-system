import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export default {
  // Server config
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Kafka config
  kafka: {
    clientId: process.env.KAFKA_CLIENT_ID || 'api-gateway',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    topics: {
      signupRequests: process.env.KAFKA_TOPIC_SIGNUP_REQUESTS || 'signup_requests',
      driverLocationUpdates: process.env.KAFKA_TOPIC_DRIVER_LOCATION_UPDATES || 'driver_location_updates',
      rideRequests: process.env.KAFKA_TOPIC_RIDE_REQUESTS || 'ride_requests',
      rideCompleted: process.env.KAFKA_TOPIC_RIDE_COMPLETED || 'ride_completed'
    }
  }
};