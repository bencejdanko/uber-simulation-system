const config = {
  port: process.env.PORT || 3001,
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/driver_service',
  },
  kafka: {
    brokers: process.env.KAFKA_BROKERS || 'localhost:9092',
    location_updates_topic: process.env.KAFKA_LOCATION_UPDATES_TOPIC || 'driver_location_updates',
    enabled: process.env.KAFKA_ENABLED !== 'false',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    cacheEnabled: process.env.DRIVER_SERVICE_CACHE_ENABLED !== 'false',
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;