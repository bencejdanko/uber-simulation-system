"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/uber-rides',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    kafka: {
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        clientId: process.env.KAFKA_CLIENT_ID || 'ride-service'
    },
    logLevel: process.env.LOG_LEVEL || 'info',
    nodeEnv: process.env.NODE_ENV || 'development',
    cors: {
        origin: process.env.CORS_ORIGIN || '*'
    }
};
