"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webSocketService = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const config_1 = require("./config");
const database_service_1 = require("./services/database.service");
const redis_service_1 = require("./services/redis.service");
const kafka_service_1 = require("./services/kafka.service");
const websocket_service_1 = require("./services/websocket.service");
const errorHandler_1 = require("./middleware/errorHandler");
const ride_routes_1 = require("./routes/ride.routes");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(config_1.config.cors));
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// Initialize services
const dbService = database_service_1.DatabaseService.getInstance();
const redisService = redis_service_1.RedisService.getInstance();
const kafkaService = kafka_service_1.KafkaService.getInstance();
const webSocketService = websocket_service_1.WebSocketService.getInstance();
exports.webSocketService = webSocketService;
// Connect to services
const connectToServices = async () => {
    try {
        // Always connect to database
        await dbService.connect();
        console.log('Connected to MongoDB');
        // Connect to Redis if available
        try {
            await redisService.connect();
            console.log('Connected to Redis');
        }
        catch (redisError) {
            console.warn('Redis connection failed, continuing without Redis:', redisError);
        }
        // Connect to Kafka if available
        try {
            await kafkaService.connect();
            console.log('Connected to Kafka');
        }
        catch (kafkaError) {
            console.warn('Kafka connection failed, continuing without Kafka:', kafkaError);
        }
        // Initialize WebSocket
        webSocketService.initialize(httpServer);
        console.log('WebSocket service initialized');
    }
    catch (error) {
        console.error('Failed to connect to services:', error);
        process.exit(1);
    }
};
// Routes
app.use('/api/v1/rides', ride_routes_1.rideRoutes);
// Error handling
app.use(errorHandler_1.errorHandler);
// Start server
const startServer = async () => {
    try {
        await connectToServices();
        httpServer.listen(config_1.config.port, () => {
            console.log(`Server is running on port ${config_1.config.port}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Graceful shutdown
const shutdown = async () => {
    console.log('Shutting down gracefully...');
    try {
        await Promise.all([
            dbService.disconnect(),
            redisService.disconnect(),
            kafkaService.disconnect()
        ]);
        httpServer.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    }
    catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
startServer();
exports.default = app;
