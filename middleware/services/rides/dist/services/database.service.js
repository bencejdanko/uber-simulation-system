"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../config");
class DatabaseService {
    constructor() {
        this.isConnected = false;
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    async connect() {
        if (this.isConnected) {
            return;
        }
        try {
            await mongoose_1.default.connect(config_1.config.mongodbUri, {
                serverSelectionTimeoutMS: 5000,
            });
            this.isConnected = true;
            console.log('Connected to MongoDB');
            // Handle connection events
            mongoose_1.default.connection.on('error', (err) => {
                console.error('MongoDB connection error:', err);
            });
            mongoose_1.default.connection.on('disconnected', () => {
                console.log('MongoDB disconnected');
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('reconnected', () => {
                console.log('MongoDB reconnected');
                this.isConnected = true;
            });
        }
        catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await mongoose_1.default.disconnect();
            this.isConnected = false;
            console.log('Disconnected from MongoDB');
        }
        catch (error) {
            console.error('Error disconnecting from MongoDB:', error);
            throw error;
        }
    }
    isDatabaseConnected() {
        return this.isConnected;
    }
}
exports.DatabaseService = DatabaseService;
