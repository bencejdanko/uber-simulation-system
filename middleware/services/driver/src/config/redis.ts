import { createClient, RedisClientType } from 'redis';
import config from './index';
import logger from './logger';

let redisClient: RedisClientType | null = null;
let isConnecting = false;

export const getRedisClient = (): RedisClientType => {
    if (!redisClient) {
        throw new Error('Redis client not initialized. Call connectRedis first.');
    }
    return redisClient;
};

export const connectRedis = async (url: string = config.redis.url): Promise<RedisClientType> => {
    if (redisClient && redisClient.isOpen) {
        logger.info('Redis client already connected.');
        return redisClient;
    }

    if (isConnecting) {
        logger.info('Redis connection already in progress.');
        // Basic wait mechanism to avoid race conditions during initial connection
        await new Promise(resolve => setTimeout(resolve, 100));
        return getRedisClient(); // Try getting the client again
    }

    isConnecting = true;
    logger.info(`Attempting to connect to Redis at: ${url}`);

    const client = createClient({ url });

    client.on('connect', () => logger.info('Redis client connecting...'));
    client.on('ready', () => {
        logger.info('✅ Redis client connected successfully and ready.');
        isConnecting = false;
    });
    client.on('error', (err) => {
        logger.error(`❌ Redis client connection error: ${err}`);
        redisClient = null; // Reset client on error
        isConnecting = false;
        // Optionally implement retry logic here
    });
    client.on('end', () => {
        logger.info('Redis client connection closed.');
        redisClient = null; // Reset client on closure
        isConnecting = false;
    });

    try {
        await client.connect();
        redisClient = client as RedisClientType; // Assign after successful connection
        return redisClient;
    } catch (err) {
        logger.error(`❌ Failed to connect to Redis: ${(err as Error).message}`);
        isConnecting = false;
        throw err; // Re-throw error to be handled by the caller (e.g., server startup)
    }
};

// Optional: Graceful shutdown
export const disconnectRedis = async (): Promise<void> => {
    if (redisClient && redisClient.isOpen) {
        logger.info('Disconnecting Redis client...');
        await redisClient.quit();
        logger.info('Redis client disconnected.');
    }
};
