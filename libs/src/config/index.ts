import dotenv from 'dotenv';
import logger from './logger';

// Load environment variables from .env file
dotenv.config();

export interface Config {
  // Kafka configuration
  kafka: {
    clientId: string;
    brokers: string[];
  };
  
  // MongoDB configuration
  mongodb: {
    uri: string;
  };
  
  // Redis configuration
  redis: {
    host: string;
    port: number;
  };
  
  // Service specific configuration
  service: {
    port: number;
    environment: 'development' | 'production' | 'test';
  };
}

// Helper function to get a required env variable
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    logger.error(`Environment variable ${key} is required but not set`);
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value;
}

// Create config object based on environment variables
export function createConfig(): Config {
  return {
    kafka: {
      clientId: process.env.KAFKA_CLIENT_ID || 'uber-simulation',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    },
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/uber-simulation',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    service: {
      port: parseInt(process.env.PORT || '3000', 10),
      environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    },
  };
}

// Export default config instance
const config = createConfig();
export default config;