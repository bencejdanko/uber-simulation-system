import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { config } from './config';
import { DatabaseService } from './services/database.service';
import { RedisService } from './services/redis.service';
import { KafkaService } from './services/kafka.service';
import { WebSocketService } from './services/websocket.service';
import { errorHandler } from './middleware/errorHandler';
import { rideRoutes } from './routes/ride.routes';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());
app.use(morgan('dev'));

// Initialize services
const dbService = DatabaseService.getInstance();
const redisService = RedisService.getInstance();
const kafkaService = KafkaService.getInstance();
const webSocketService = WebSocketService.getInstance();

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
    } catch (redisError) {
      console.warn('Redis connection failed, continuing without Redis:', redisError);
    }

    // Connect to Kafka if available
    try {
      await kafkaService.connect();
      console.log('Connected to Kafka');
    } catch (kafkaError) {
      console.warn('Kafka connection failed, continuing without Kafka:', kafkaError);
    }

    // Initialize WebSocket
    webSocketService.initialize(httpServer);
    console.log('WebSocket service initialized');
  } catch (error) {
    console.error('Failed to connect to services:', error);
    process.exit(1);
  }
};

// Routes
app.use('/api/v1/rides', rideRoutes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectToServices();
    httpServer.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  } catch (error) {
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
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();

export { webSocketService };
export default app; 