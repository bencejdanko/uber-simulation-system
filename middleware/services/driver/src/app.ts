import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import config from './config';
import logger from './config/logger';
import driverRoutes from './routes/driver.routes';

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
        // Let the caller handle the error
        throw err;
    }
};

const app = express();

// Middleware
app.use(express.json());
// Remove global authentication hook; use route-level authentication
// app.use(authMiddleware);

// Root health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Routes
app.use('/api/v1/drivers', driverRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err);
    res.status(err.status || 500).json({
        error: 'internal_server_error',
        message: 'An unexpected error occurred.'
    });
});

export default app;