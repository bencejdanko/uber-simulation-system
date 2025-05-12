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
      console.log(`[RideService.updateRide] Attempting to update ride with ID: ${rideId}`, updateData);
      const ride = await Ride.findByIdAndUpdate(
        rideId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!ride) {
        console.warn(`[RideService.updateRide] Ride not found with ID: ${rideId} for update.`);
        return null;
      }

      console.log(`[RideService.updateRide] Ride ${rideId} updated successfully.`);
      if (this.redisService && typeof this.redisService.cacheRide === 'function') {
        await this.redisService.cacheRide(ride);
        console.log(`[RideService.updateRide] Ride ${rideId} updated in cache.`);
      }
      return ride;
    } catch (error) {
      console.error(`[RideService.updateRide] Error updating ride ${rideId}:`, error);
      throw new AppError('Failed to update ride details', 500);
    }
  }

  public async cancelRide(rideId: string, reason?: string): Promise<IRide | null> {
    const _id = rideId;
    console.log(`[RideService.cancelRide] Attempting to cancel ride with _id: ${_id}, Reason: ${reason || 'No reason provided'}`);

    try {
      const updatePayload: any = {
        status: 'CANCELLED',
        updatedAt: new Date(),
      };
      if (reason) {
        updatePayload.cancellationReason = reason;
      }

      const updatedRide = await Ride.findByIdAndUpdate(
        _id,
        { $set: updatePayload },
        { new: true, runValidators: true }
      );

      if (!updatedRide) {
        console.warn(`[RideService.cancelRide] Ride not found with _id: ${_id} during findByIdAndUpdate for cancellation.`);
        throw new AppError('Failed to cancel existing ride: Ride not found', 404);
      }

      console.log(`[RideService.cancelRide] Ride ${_id} status set to CANCELLED successfully.`);

      if (this.redisService && typeof this.redisService.invalidateRide === 'function') {
        await this.redisService.invalidateRide(_id);
        console.log(`[RideService.cancelRide] Ride cache invalidated for ${_id}.`);
      } else if (this.redisService && typeof this.redisService.cacheRide === 'function') {
        await this.redisService.cacheRide(updatedRide);
        console.log(`[RideService.cancelRide] Ride ${_id} updated in cache with cancelled status.`);
      }

      return updatedRide;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error(`[RideService.cancelRide] Unexpected error cancelling ride ${_id}:`, error);
      throw new AppError('Internal server error while attempting to cancel ride', 500);
    }
  }

  public async searchRides(filters: {
    status?: string;
    latitude?: number;
    longitude?: number;
    radius?: number; // in meters
    customerId?: string;
    driverId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ rides: IRide[]; total: number }> {
    try {
      const { status, latitude, longitude, radius = 5000, customerId, driverId, page = 1, limit = 10 } = filters;
      const query: any = {};

      if (status) query.status = status;
      if (customerId) query.customerId = customerId;
      if (driverId) query.driverId = driverId;

      // Geospatial query if location parameters are provided
      if (typeof latitude === 'number' && typeof longitude === 'number' && typeof radius === 'number') {
        query.pickupLocation = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude], // MongoDB expects [longitude, latitude]
            },
            $maxDistance: radius, // in meters
          },
        };
      }

      const skip = (page - 1) * limit;

      const [rides, total] = await Promise.all([
        Ride.find(query)
          .sort({ createdAt: -1 }) // Default sort, can be made configurable
          .skip(skip)
          .limit(limit)
          .lean(), // Use .lean() for faster queries if full Mongoose documents aren't needed
        Ride.countDocuments(query),
      ]);

      return { rides, total };
    } catch (error) {
      console.error('❌ Error in RideService.searchRides:', error);
      throw new AppError('Failed to search rides', 500);
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