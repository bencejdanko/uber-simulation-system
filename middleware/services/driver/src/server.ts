import { createServer } from 'http';
import config from './config';
import logger from './config/logger';
import app, { connectDB } from './app';

const server = createServer(app);

// Initialize database connection before starting the server
const startServer = async () => {
  try {
    await connectDB();
    
    // Start the server
    const PORT = config.port || 3000;
    server.listen(PORT, () => {
      logger.info(`Driver service is running on http://localhost:${PORT}`);
    });

    server.on('error', (error) => {
      logger.error(`Server error: ${error.message}`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${(err as Error).message}`);
    process.exit(1);
  }
};

startServer();