import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3004,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://mongo:27017/uber_simulation',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_here',
  kafka: {
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    clientId: process.env.KAFKA_CLIENT_ID || 'uber-rides-service',
    ridesRequestedTopic: process.env.KAFKA_RIDE_REQUEST_TOPIC || 'ride_requests',  
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
}; 