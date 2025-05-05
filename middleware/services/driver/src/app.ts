import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import config from './config';
import logger from './config/logger';
import driverRoutes from './routes/driver.routes';
import KafkaService from './services/kafka.service'; // Import KafkaService
import { DriverService } from './services/driver.service'; // Import DriverService
import DriverController from './controllers/driver.controller'; // Import DriverController
import { connectRedis, disconnectRedis, getRedisClient } from './config/redis'; // Import Redis functions

// Global service instances (will be initialized)
let kafkaService: KafkaService;
let driverService: DriverService;
let driverController: DriverController;

// Export database connection function to be used by server.ts and tests
export const connectDB = async (uri: string = config.db.uri): Promise<void> => {
    // Enable mongoose debug mode to print all queries
    mongoose.set('debug', true);
    // Log mongoose connection lifecycle events
    mongoose.connection.on('connecting', () => console.log('Mongoose connecting to:', uri));
    mongoose.connection.on('connected', () => console.log('Mongoose connected'));    
    mongoose.connection.on('error', err => console.log('Mongoose connection error:', err));
    mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));
    try {
        // Use console.log for immediate visibility in tests
        console.log(`Attempting to connect to MongoDB at: ${uri}`);
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        } as mongoose.ConnectOptions);
        console.log('✅ MongoDB connected successfully');
    } catch (err) {
        console.log(`❌ MongoDB connection failed: ${(err as Error).message}`);
        // Don't exit process here, as this would terminate tests
        // Let the caller handle the error
        throw err;
    }
};

// Function to initialize all services
export const initializeServices = async (): Promise<{ kafkaService: KafkaService }> => {
    await connectDB();
    await connectRedis();

    // Initialize and connect Kafka only if enabled
    if (config.kafka.enabled) {
        kafkaService = new KafkaService(config.kafka.brokers.split(','));
        await kafkaService.connect(); // Connect Kafka
    } else {
        logger.warn('Kafka is disabled via config. KafkaService not initialized.');
        // Provide a dummy or null KafkaService if needed by other services when disabled
        // For now, we assume DriverService handles the disabled case (as it does)
    }

    // Instantiate services that depend on Kafka *after* it's connected (or known to be disabled)
    // Pass kafkaService (even if undefined/null when disabled)
    driverService = new DriverService(kafkaService!);
    driverController = new DriverController(driverService);

    return { kafkaService }; // Return kafkaService for shutdown handling
};

const app = express();

// Middleware
app.use(express.json());

// Root health check endpoint
app.get('/health', (req, res) => {
    // Add checks for DB, Redis, Kafka connections if desired
    const kafkaStatus = config.kafka.enabled ? (kafkaService ? 'connected' : 'error') : 'disabled';
    const redisStatus = getRedisClient()?.isOpen ? 'connected' : 'disconnected';
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.status(200).json({ 
        status: 'healthy', 
        dependencies: {
            database: dbStatus,
            redis: redisStatus,
            kafka: kafkaStatus
        }
    });
});

// Routes - Pass the initialized controller
// Note: driverRoutes needs to be adapted to accept the controller
app.use('/api/v1/drivers', (req, res, next) => {
    // Ensure controller is initialized before handling routes
    if (!driverController) {
        logger.error('DriverController not initialized before request');
        return res.status(503).json({ error: 'service_unavailable', message: 'Driver service is initializing.' });
    }
    // Use the initialized router from driverRoutes, passing the controller
    driverRoutes(driverController)(req, res, next);
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err);
    res.status(err.status || 500).json({
        error: 'internal_server_error',
        message: 'An unexpected error occurred.'
    });
});

export default app;