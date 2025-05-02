import { IRide } from '../models/ride.model';
import { Ride } from '../models/ride.model';
import { RedisService } from './redis.service';
import { AppError } from '../middleware/errorHandler';

export class RideService {
  private static instance: RideService;
  private redisService: RedisService;

  private constructor() {
    this.redisService = RedisService.getInstance();
  }

  public static getInstance(): RideService {
    if (!RideService.instance) {
      RideService.instance = new RideService();
    }
    return RideService.instance;
  }

  public async createRide(rideData: Partial<IRide>): Promise<IRide> {
    try {
      const ride = new Ride(rideData);
      await ride.save();
      await this.redisService.cacheRide(ride);
      return ride;
    } catch (error) {
      throw new AppError('Failed to create ride', 500);
    }
  }

  public async getRideById(rideId: string): Promise<IRide | null> {
    try {
      // Try to get from cache first
      const cachedRide = await this.redisService.getCachedRide(rideId);
      if (cachedRide) {
        return cachedRide;
      }

      // If not in cache, get from database
      const ride = await Ride.findById(rideId);
      if (ride) {
        await this.redisService.cacheRide(ride);
      }
      return ride;
    } catch (error) {
      throw new AppError('Failed to get ride', 500);
    }
  }

  public async getRidesByUser(userId: string): Promise<IRide[]> {
    try {
      // Try to get from cache first
      const cachedRides = await this.redisService.getCachedRideList(userId);
      if (cachedRides) {
        return cachedRides;
      }

      // If not in cache, get from database
      const rides = await Ride.find({ userId });
      if (rides.length > 0) {
        await this.redisService.cacheRideList(userId, rides);
      }
      return rides;
    } catch (error) {
      throw new AppError('Failed to get user rides', 500);
    }
  }

  public async listRides(filters: {
    status?: string;
    customerId?: string;
    driverId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ rides: IRide[]; total: number }> {
    try {
      const { status, customerId, driverId, page = 1, limit = 10 } = filters;
      const query: any = {};

      if (status) query.status = status;
      if (customerId) query.customerId = customerId;
      if (driverId) query.driverId = driverId;

      const skip = (page - 1) * limit;

      const [rides, total] = await Promise.all([
        Ride.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Ride.countDocuments(query)
      ]);

      return { rides, total };
    } catch (error) {
      throw new AppError('Failed to list rides', 500);
    }
  }

  public async updateRide(rideId: string, updateData: Partial<IRide>): Promise<IRide | null> {
    try {
      const ride = await Ride.findByIdAndUpdate(
        rideId,
        { $set: updateData },
        { new: true }
      );

      if (ride) {
        await this.redisService.cacheRide(ride);
      }
      return ride;
    } catch (error) {
      throw new AppError('Failed to update ride', 500);
    }
  }

  public async cancelRide(rideId: string, reason?: string): Promise<IRide | null> {
    try {
      const ride = await Ride.findByIdAndUpdate(
        rideId,
        {
          $set: {
            status: 'CANCELLED',
            cancellationReason: reason
          }
        },
        { new: true }
      );

      if (ride) {
        await this.redisService.invalidateRide(rideId);
      }
      return ride;
    } catch (error) {
      throw new AppError('Failed to cancel ride', 500);
    }
  }

  public async findNearbyDrivers(
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<string[]> {
    try {
      return await this.redisService.findNearbyDrivers(latitude, longitude, radius);
    } catch (error) {
      throw new AppError('Failed to find nearby drivers', 500);
    }
  }

  public async updateDriverLocation(
    driverId: string,
    location: { latitude: number; longitude: number }
  ): Promise<void> {
    try {
      await this.redisService.cacheDriverLocation(driverId, location);
    } catch (error) {
      throw new AppError('Failed to update driver location', 500);
    }
  }

  public async updateDriverAvailability(
    driverId: string,
    isAvailable: boolean
  ): Promise<void> {
    try {
      if (!isAvailable) {
        await this.redisService.invalidateDriverLocation(driverId);
      }
    } catch (error) {
      throw new AppError('Failed to update driver availability', 500);
    }
  }
} 