"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3004,
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/uber-rides',
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_here',
    kafka: {
        brokers: ((_a = process.env.KAFKA_BROKERS) === null || _a === void 0 ? void 0 : _a.split(',')) || ['localhost:9092'],
        clientId: process.env.KAFKA_CLIENT_ID || 'uber-rides-service',
    },
    logLevel: process.env.LOG_LEVEL || 'info',
    nodeEnv: process.env.NODE_ENV || 'development',
};
