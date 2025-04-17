import dotenv from 'dotenv';
import path from 'path';

// Explicitly specify the path to the .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: process.env.PORT || 3000,
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/driver_service',
  },
  kafka: {
    brokers: process.env.KAFKA_BROKERS || 'localhost:9092',
    topic: process.env.KAFKA_TOPIC || 'driver-events',
  },
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;