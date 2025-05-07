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
      console.log('Attempting to create new Ride object with data:', rideData);

      const modelData: any = {
        ...rideData, // Spread other properties
      };

      // Transform pickupLocation if it exists and is in {latitude, longitude} format
      if (rideData.pickupLocation && 
          typeof (rideData.pickupLocation as any).latitude === 'number' && 
          typeof (rideData.pickupLocation as any).longitude === 'number') {
        const ploc = rideData.pickupLocation as any;
        modelData.pickupLocation = {
          type: 'Point',
          coordinates: [ploc.longitude, ploc.latitude] // GeoJSON is [longitude, latitude]
        };
      } else if (rideData.pickupLocation) {
        // If not in lat/lon format, assume it's already GeoJSON or handle error
        modelData.pickupLocation = rideData.pickupLocation;
      }

      // Transform dropoffLocation similarly
      if (rideData.dropoffLocation && 
          typeof (rideData.dropoffLocation as any).latitude === 'number' && 
          typeof (rideData.dropoffLocation as any).longitude === 'number') {
        const dloc = rideData.dropoffLocation as any;
        modelData.dropoffLocation = {
          type: 'Point',
          coordinates: [dloc.longitude, dloc.latitude] // GeoJSON is [longitude, latitude]
        };
      } else if (rideData.dropoffLocation) {
        modelData.dropoffLocation = rideData.dropoffLocation;
      }

      // Ensure status is set if not provided
      if (!modelData.status) {
          modelData.status = 'REQUESTED';
      }

      const ride = new Ride(modelData);
      console.log('Ride object to be saved:', ride.toObject ? ride.toObject() : ride);

      console.log('Attempting to save ride to database...');
      await ride.save();
      console.log('Ride saved to database successfully.');

      console.log('Attempting to cache ride in Redis...');
      await this.redisService.cacheRide(ride);
      console.log('Ride cached in Redis successfully.');

      return ride;
    } catch (error) {
      console.error('❌ Error in RideService.createRide:', error);
      if (error instanceof Error) {
        console.error('❌ RideService.createRide Error name:', error.name);
        console.error('❌ RideService.createRide Error message:', error.message);
        console.error('❌ RideService.createRide Error stack:', error.stack);
      } else {
        console.error('❌ RideService.createRide Caught a non-Error object:', error);
      }
      // Re-throw the original error or a new AppError if you want to handle it further up the chain
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
      const updatePayload: any = { ...updateData };

      // Transform pickupLocation if it exists and is in {latitude, longitude} format
      if (updateData.pickupLocation && 
          typeof (updateData.pickupLocation as any).latitude === 'number' && 
          typeof (updateData.pickupLocation as any).longitude === 'number') {
        const ploc = updateData.pickupLocation as any;
        updatePayload.pickupLocation = {
          type: 'Point',
          coordinates: [ploc.longitude, ploc.latitude] // GeoJSON is [longitude, latitude]
        };
      } else if (updateData.pickupLocation) {
        // If not in lat/lon format, assume it's already GeoJSON or handle error
        updatePayload.pickupLocation = updateData.pickupLocation;
      }

      // Transform dropoffLocation similarly
      if (updateData.dropoffLocation && 
          typeof (updateData.dropoffLocation as any).latitude === 'number' && 
          typeof (updateData.dropoffLocation as any).longitude === 'number') {
        const dloc = updateData.dropoffLocation as any;
        updatePayload.dropoffLocation = {
          type: 'Point',
          coordinates: [dloc.longitude, dloc.latitude] // GeoJSON is [longitude, latitude]
        };
      } else if (updateData.dropoffLocation) {
        updatePayload.dropoffLocation = updateData.dropoffLocation;
      }

      const ride = await Ride.findByIdAndUpdate(
        rideId,
        { $set: updatePayload },
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