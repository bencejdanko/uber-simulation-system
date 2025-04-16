import { createClient, RedisClientType } from 'redis';
import config from '../config';
import logger from '../config/logger';

// Creates and configures a Redis client
export async function createRedisClient(): Promise<RedisClientType> {
  const client = createClient({
    url: `redis://${config.redis.host}:${config.redis.port}`,
  });

  // Handle Redis connection errors
  client.on('error', (err) => {
    logger.error({ err }, 'Redis client error');
  });

  // Log when Redis connection is established
  client.on('connect', () => {
    logger.info('Redis client connected');
  });

  // Connect to Redis
  await client.connect();
  
  return client;
}

// Geo-related functions for driver locations
export const geoUtils = {
  // Add driver location to the geo index
  async addDriverLocation(
    client: RedisClientType,
    driverId: string,
    longitude: number,
    latitude: number
  ): Promise<number> {
    try {
      const result = await client.geoAdd('driver_locations', {
        longitude,
        latitude,
        member: driverId,
      });
      
      logger.debug({ driverId, longitude, latitude }, 'Added driver location to Redis');
      return result;
    } catch (error) {
      logger.error({ error, driverId }, 'Failed to add driver location to Redis');
      throw error;
    }
  },

  // Find nearby drivers within a radius
  async findNearbyDrivers(
    client: RedisClientType,
    longitude: number,
    latitude: number,
    radiusInMeters: number = 5000,
    limit: number = 10
  ): Promise<{ driverId: string; distance: number }[]> {
    try {
      const results = await client.geoSearchWith(
        'driver_locations',
        { longitude, latitude },
        { radius: radiusInMeters, unit: 'm' },
        { WITHDIST: true, COUNT: limit, SORT: 'ASC' }
      );
      
      // Convert results to a more usable format
      return results.map((item) => ({
        driverId: item.member.toString(),
        distance: parseFloat(item.distance.toString()),
      }));
    } catch (error) {
      logger.error({ error, longitude, latitude }, 'Failed to find nearby drivers');
      throw error;
    }
  },
};