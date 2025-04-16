import express from 'express';
import { createServer } from 'http';
import config from './config';
import logger from './config/logger';
import router from './routes/driver.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { validateDriverInput } from './middleware/validation.middleware';

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(authMiddleware);
app.use(validateDriverInput);

// Routes
app.use('/api/v1/drivers', router);

// Start the server
const PORT = config.port || 3000;
server.listen(PORT, () => {
    logger.info(`Driver service is running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
    logger.error(`Server error: ${error.message}`);
});