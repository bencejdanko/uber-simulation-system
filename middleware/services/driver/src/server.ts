import { createServer } from 'http';
import config from './config';
import logger from './config/logger';
import app, { initializeServices } from './app'; // Import initializeServices
import { disconnectRedis } from './config/redis';

const server = createServer(app);

// Initialize services and start the server
const startServer = async () => {
  let kafkaService: any = null; // Variable to hold KafkaService for shutdown
  try {
    // Initialize all services (DB, Redis, Kafka)
    const services = await initializeServices();
    kafkaService = services.kafkaService; // Get KafkaService instance if enabled

    // Start the HTTP server only after services are initialized
    const PORT = config.port || 3000;
    server.listen(PORT, () => {
      logger.info(`Driver service is running on http://localhost:${PORT}`);
    });

    server.on('error', (error) => {
      logger.error(`Server error: ${error.message}`);
      // Consider more robust error handling, e.g., attempting restart
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server, Redis, and Kafka connections');
      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectRedis(); // Disconnect Redis gracefully
        if (kafkaService) {
          await kafkaService.disconnect(); // Disconnect Kafka gracefully if it was initialized
        }
        // Optionally disconnect DB if needed, though often connections are managed differently
        process.exit(0);
      });

      // Force shutdown if graceful shutdown takes too long
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000); // 10 seconds timeout
    });

  } catch (err) {
    logger.error(`❌ Failed to initialize services or start server: ${(err as Error).message}`);
    // Attempt cleanup even on startup failure
    await disconnectRedis().catch(e => logger.error('Error disconnecting Redis during failed startup:', e));
    if (kafkaService) {
        await kafkaService.disconnect().catch((e: any) => logger.error('Error disconnecting Kafka during failed startup:', e));
    }
    process.exit(1); // Exit if initialization fails
  }
};

startServer();