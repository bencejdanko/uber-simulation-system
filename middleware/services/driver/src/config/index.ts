const config = {
  port: process.env.PORT || 3001,
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/driver_service',
  },
  kafka: {
    brokers: process.env.KAFKA_BROKERS || 'localhost:9092',
    topic: process.env.KAFKA_TOPIC || 'driver-events',
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;