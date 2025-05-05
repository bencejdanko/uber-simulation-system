import { createServer } from 'http';
import config from './config';
import logger from './config/logger';
import app, { connectDB } from './app';
import { connectRedis, disconnectRedis } from './config/redis'; // Import Redis functions

const server = createServer(app);

// Initialize database and Redis connections before starting the server
const startServer = async () => {
  try {
    await connectDB();
    await connectRedis(); // Connect to Redis
    
    // Start the server
    const PORT = config.port || 3000;
    server.listen(PORT, () => {
      logger.info(`Driver service is running on http://localhost:${PORT}`);
    });

    server.on('error', (error) => {
      logger.error(`Server error: ${error.message}`);
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server and Redis connection');
      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectRedis(); // Disconnect Redis gracefully
        process.exit(0);
      });
    });

  } catch (err) {
    logger.error(`Failed to start server: ${(err as Error).message}`);
    process.exit(1);
  }
};

startServer();