"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConfig = createConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("./logger"));
// Load environment variables from .env file
dotenv_1.default.config();
// Helper function to get a required env variable
function getRequiredEnv(key) {
    const value = process.env[key];
    if (!value) {
        logger_1.default.error(`Environment variable ${key} is required but not set`);
        throw new Error(`Environment variable ${key} is required but not set`);
    }
    return value;
}
// Create config object based on environment variables
function createConfig() {
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
            environment: process.env.NODE_ENV || 'development',
        },
    };
}
// Export default config instance
const config = createConfig();
exports.default = config;
