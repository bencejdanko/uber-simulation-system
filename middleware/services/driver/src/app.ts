import express from 'express';
import { json } from 'body-parser';
import { logger } from './config/logger';
import { driverRoutes } from './routes/driver.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { validationMiddleware } from './middleware/validation.middleware';

const app = express();

// Middleware
app.use(json());
app.use(authMiddleware);
app.use(validationMiddleware);

// Routes
app.use('/api/v1/drivers', driverRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err);
    res.status(err.status || 500).json({
        error: 'internal_server_error',
        message: 'An unexpected error occurred.'
    });
});

export default app;