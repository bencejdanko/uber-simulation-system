import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import rideRoutes from './routes/ride.routes';
import { WebSocketService } from './services/websocket.service';
import { DatabaseService } from './services/database.service';
import { RedisService } from './services/redis.service';
import { KafkaService } from './services/kafka.service';

const app = express();
const httpServer = createServer(app);

// Initialize services
const webSocketService = WebSocketService.getInstance();
const databaseService = DatabaseService.getInstance();
const redisService = RedisService.getInstance();
const kafkaService = KafkaService.getInstance();

// Initialize WebSocket
webSocketService.initialize(httpServer);

// Connect to services
Promise.all([
  databaseService.connect(),
  redisService.connect(),
  kafkaService.connect()
]).catch((error) => {
  console.error('Failed to connect to services:', error);
  process.exit(1);
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/rides', rideRoutes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.port || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  await Promise.all([
    databaseService.disconnect(),
    redisService.disconnect(),
    kafkaService.disconnect()
  ]);
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { webSocketService };
export default app; 