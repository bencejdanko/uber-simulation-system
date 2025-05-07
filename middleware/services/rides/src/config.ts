interface Config {
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  kafka: {
    brokers: string[];
    clientId: string;
    ridesRequestedTopic: string;
  };
  logLevel: string;
  nodeEnv: string;
  cors: {
    origin: string;
  };
}

export const config: Config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://mongo:27017/uber_simulation',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'ride-service',
    ridesRequestedTopic: process.env.KAFKA_RIDE_REQUEST_TOPIC || 'ride_requests',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  }
};