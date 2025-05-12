import { Request, Response, NextFunction } from 'express';
import { IRide } from '../models/ride.model';
import { webSocketService } from '../app';
import { KafkaService } from '../services/kafka.service';
import { RideService } from '../services/ride.service';
import { AppError } from '../middleware/errorHandler';
import { verifyToken, checkRole, checkRideAccess } from '../middleware/auth.middleware';

const kafkaService = KafkaService.getInstance();
const rideService = RideService.getInstance();

export const rideController = {
  async createRide(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('✅ createRide hit');
      console.log('📄 Request body:', JSON.stringify(req.body, null, 2));

      // Extract customerId from x-jwt-claim-sub header that Kong provides
      const customerId = req.headers['x-jwt-claim-sub'] as string;
    
      console.log('🔐 CustomerId from JWT claim:', customerId);

      const rideData = {
        ...req.body,
        customerId,  // Use the ID from the JWT header
        status: 'REQUESTED'
      };

      // Create ride in database and cache
      const ride = await rideService.createRide(rideData);

      // Publish ride requested event
      // await kafkaService.publishRideRequested(ride);

      // Find and notify nearby drivers using cached locations
      const nearbyDrivers = await rideService.findNearbyDrivers(
        ride.pickupLocation.coordinates[1], // latitude
        ride.pickupLocation.coordinates[0], // longitude
      );

      for (const driverId of nearbyDrivers) {
        webSocketService.notifyNewRideRequest(ride, driverId);
      }

      res.status(202).json(ride);
    } catch (error) {
      console.error('❌ Error caught in createRide controller:', error);
      if (error instanceof Error) {
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      } else {
        console.error('❌ Caught a non-Error object:', error);
      }
      next(error);
    }
  },

  async getRide(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { rideId } = req.params;
      const ride = await rideService.getRideById(rideId);

      if (!ride) {
        throw new AppError('Ride not found', 404);
      }

      // Check if user has access to this ride
      if (ride.customerId !== req.user.userId && 
          ride.driverId !== req.user.userId && 
          !req.user.roles.includes('ADMIN')) {
        throw new AppError('Access denied to this ride', 403);
      }

      res.json(ride);
    } catch (error) {
      next(error);
    }
  },

  async listRides(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { status, for_customer_id, for_driver_id, page, limit } = req.query;

      // If not admin, only show rides for the user
      if (!req.user.roles.includes('ADMIN')) {
        const rides = await rideService.getRidesByUser(req.user.userId);
        res.json({ rides, total: rides.length });
      } else {
        // Admin can see all rides or filter by customer/driver
        const filters = {
          status: status as string,
          customerId: for_customer_id as string,
          driverId: for_driver_id as string,
          page: Number(page) || 1,
          limit: Number(limit) || 10
        };

        const { rides, total } = await rideService.listRides(filters);
        res.json({ rides, total });
      }
    } catch (error) {
      next(error);
    }
  },

  async cancelRide(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id: rideId } = req.params;
      const { reason } = req.body;

      // Get ride from cache or database
      const ride = await rideService.getRideById(rideId);
      if (!ride) {
        throw new AppError('[controller.cancelRide]: Ride not found', 404);
      }

      // Check if user has permission to cancel this ride
      if (ride.customerId !== req.user.userId && 
          ride.driverId !== req.user.userId && 
          !req.user.roles.includes('ADMIN')) {
        throw new AppError('Access denied to cancel this ride', 403);
      }

      // Update ride status and invalidate cache
      const updatedRide = await rideService.cancelRide(rideId, reason);
      if (!updatedRide) {
        throw new AppError('Failed to cancel ride', 500);
      }


      // Publish ride cancelled event
      // await kafkaService.publishRideCancelled(updatedRide, reason);

      // Notify driver if assigned
      if (updatedRide.driverId) {
        webSocketService.notifyRideCancellation(updatedRide, updatedRide.driverId);
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async findNearbyDrivers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Only customers and admins can find nearby drivers
      if (!req.user.roles.includes('CUSTOMER') && !req.user.roles.includes('ADMIN')) {
        throw new AppError('Access denied', 403);
      }

      const { latitude, longitude, radius = 5000 } = req.query;

      // Use cached driver locations for faster response
      const drivers = await rideService.findNearbyDrivers(
        Number(latitude),
        Number(longitude),
        Number(radius)
      );

      res.json({ drivers });
    } catch (error) {
      next(error);
    }
  },

  async searchRides(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { status, latitude, longitude, radius, page, limit, customerId, driverId } = req.query;

      const filters: { [key: string]: any } = {
        status: status as string | undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        radius: radius ? Number(radius) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        customerId: customerId as string | undefined,
        driverId: driverId as string | undefined
      };

      // Remove undefined filters to avoid issues with the service layer
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const { rides, total } = await rideService.searchRides(filters as any); // Cast to any for now, will be typed by RideService method
      res.json({ rides, total });
    } catch (error) {
      next(error);
    }
  },

  async updateDriverLocation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Only drivers can update their location
      if (!req.user.roles.includes('DRIVER')) {
        throw new AppError('Access denied', 403);
      }

      const { latitude, longitude } = req.body;

      // Update driver location in cache
      await rideService.updateDriverLocation(req.user.userId, {
        latitude,
        longitude
      });

      // Publish driver location updated event
      await kafkaService.publishDriverLocationUpdated(req.user.userId, {
        latitude,
        longitude
      });

      res.json({ message: 'Driver location updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  async acceptRide(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Only drivers can accept rides
      if (!req.user.roles.includes('DRIVER')) {
        throw new AppError('Access denied', 403);
      }

      const { rideId } = req.params;
      const ride = await rideService.getRideById(rideId);

      if (!ride) {
        throw new AppError('Ride not found', 404);
      }

      if (ride.status !== 'REQUESTED') {
        throw new AppError('Ride is not available for acceptance', 400);
      }

      const previousStatus = ride.status;
      const updatedRide = await rideService.updateRide(rideId, {
        status: 'ACCEPTED',
        driverId: req.user.userId
      });

      if (!updatedRide) {
        throw new AppError('Failed to accept ride', 500);
      }

      // Publish status update and driver assignment events
      await Promise.all([
        kafkaService.publishRideStatusUpdated(updatedRide, previousStatus),
        kafkaService.publishDriverAssigned(updatedRide)
      ]);

      // Notify customer
      webSocketService.notifyRideAccepted(updatedRide, updatedRide.customerId);

      res.json(updatedRide);
    } catch (error) {
      next(error);
    }
  },

  async completeRide(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Only drivers can complete rides
      if (!req.user.roles.includes('DRIVER')) {
        throw new AppError('Access denied', 403);
      }

      const { rideId } = req.params;
      const ride = await rideService.getRideById(rideId);

      if (!ride) {
        throw new AppError('Ride not found', 404);
      }

      if (ride.driverId !== req.user.userId) {
        throw new AppError('You are not assigned to this ride', 403);
      }

      if (ride.status !== 'IN_PROGRESS') {
        throw new AppError('Ride is not in progress', 400);
      }

      const previousStatus = ride.status;
      const updatedRide = await rideService.updateRide(rideId, {
        status: 'COMPLETED'
      });

      if (!updatedRide) {
        throw new AppError('Failed to complete ride', 500);
      }

      // Publish status update and completion events
      await Promise.all([
        kafkaService.publishRideStatusUpdated(updatedRide, previousStatus),
        kafkaService.publishRideCompleted(updatedRide)
      ]);

      // Notify customer
      webSocketService.notifyRideCompleted(updatedRide, updatedRide.customerId);

      res.json(updatedRide);
    } catch (error) {
      next(error);
    }
  }
};