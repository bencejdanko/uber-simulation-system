import app from './app';
import config from './config';
import { logger } from './config/logger';
import kafkaService from './services/kafka.service';

const PORT = config.port;

// Initialize server
const startServer = async () => {
  try {
    // Try to connect to Kafka but don't block server startup
    kafkaService.connect().catch(err => {
      logger.warn('Failed to connect to Kafka on startup, will retry on first message send', err);
    });

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`API Gateway started on port ${PORT}`);
      logger.info(`Server running in ${config.nodeEnv} mode`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      try {
        await kafkaService.disconnect();
        logger.info('Server shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', error);
        process.exit(1);
      }
    };

    // Listen for termination signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();