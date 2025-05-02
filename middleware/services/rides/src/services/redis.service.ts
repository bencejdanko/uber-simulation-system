import { createClient } from 'redis';
import { config } from '../config';
import { IRide } from '../models/ride.model';
import { IUser } from '../models/user.model';

export class RedisService {
  private static instance: RedisService;
  private client;
  private isConnected = false;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    this.setupEventHandlers();
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('Connected to Redis');
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('Reconnecting to Redis...');
    });

    this.client.on('end', () => {
      console.log('Redis connection closed');
      this.isConnected = false;
    });
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.quit();
      this.isConnected = false;
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  // Ride caching methods
  public async cacheRide(ride: IRide): Promise<void> {
    if (!this.isConnected) return;

    try {
      const key = `ride:${ride._id}`;
      await this.client.set(key, JSON.stringify(ride), {
        EX: 3600 // 1 hour expiration
      });
    } catch (error) {
      console.error('Error caching ride:', error);
    }
  }

  public async getCachedRide(rideId: string): Promise<IRide | null> {
    if (!this.isConnected) return null;

    try {
      const key = `ride:${rideId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting cached ride:', error);
      return null;
    }
  }

  public async invalidateRide(rideId: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      const key = `ride:${rideId}`;
      await this.client.del(key);
    } catch (error) {
      console.error('Error invalidating ride cache:', error);
    }
  }

  // Driver location caching methods
  public async cacheDriverLocation(driverId: string, location: { latitude: number; longitude: number }): Promise<void> {
    if (!this.isConnected) return;

    try {
      const key = `driver:location:${driverId}`;
      await this.client.set(key, JSON.stringify(location), {
        EX: 300 // 5 minutes expiration
      });

      // Update driver's location in the geospatial index
      await this.client.geoAdd('drivers:locations', {
        longitude: location.longitude,
        latitude: location.latitude,
        member: driverId
      });
    } catch (error) {
      console.error('Error caching driver location:', error);
    }
  }

  public async getCachedDriverLocation(driverId: string): Promise<{ latitude: number; longitude: number } | null> {
    if (!this.isConnected) return null;

    try {
      const key = `driver:location:${driverId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting cached driver location:', error);
      return null;
    }
  }

  public async findNearbyDrivers(
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<string[]> {
    if (!this.isConnected) return [];

    try {
      const results = await this.client.geoSearch(
        'drivers:locations',
        {
          longitude,
          latitude
        },
        {
          radius,
          unit: 'm'
        }
      );

      return results;
    } catch (error) {
      console.error('Error finding nearby drivers:', error);
      return [];
    }
  }

  public async invalidateDriverLocation(driverId: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      const key = `driver:location:${driverId}`;
      await this.client.del(key);
      await this.client.zRem('drivers:locations', driverId);
    } catch (error) {
      console.error('Error invalidating driver location cache:', error);
    }
  }

  // Ride list caching methods
  public async cacheRideList(userId: string, rides: IRide[]): Promise<void> {
    if (!this.isConnected) return;

    try {
      const key = `user:rides:${userId}`;
      await this.client.set(key, JSON.stringify(rides), {
        EX: 300 // 5 minutes expiration
      });
    } catch (error) {
      console.error('Error caching ride list:', error);
    }
  }

  public async getCachedRideList(userId: string): Promise<IRide[] | null> {
    if (!this.isConnected) return null;

    try {
      const key = `user:rides:${userId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting cached ride list:', error);
      return null;
    }
  }

  public async invalidateRideList(userId: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      const key = `user:rides:${userId}`;
      await this.client.del(key);
    } catch (error) {
      console.error('Error invalidating ride list cache:', error);
    }
  }
} 