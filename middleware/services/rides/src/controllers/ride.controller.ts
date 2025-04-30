import { Request, Response } from 'express';
import { rideService } from '../services/ride.service';
import { AppError } from '../middleware/errorHandler';

export const rideController = {
  async createRide(req: Request, res: Response) {
    try {
      const ride = await rideService.createRide(req.body);
      res.status(201).json(ride);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create ride', 500);
    }
  },

  async getRide(req: Request, res: Response) {
    try {
      const ride = await rideService.getRide(req.params.rideId);
      if (!ride) {
        throw new AppError('Ride not found', 404);
      }
      res.json(ride);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get ride', 500);
    }
  },

  async listRides(req: Request, res: Response) {
    try {
      const rides = await rideService.listRides(req.query);
      res.json(rides);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to list rides', 500);
    }
  },

  async cancelRide(req: Request, res: Response) {
    try {
      await rideService.cancelRide(req.params.rideId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to cancel ride', 500);
    }
  },

  async findNearbyDrivers(req: Request, res: Response) {
    try {
      const { latitude, longitude, radius } = req.query;
      const drivers = await rideService.findNearbyDrivers(
        Number(latitude),
        Number(longitude),
        Number(radius)
      );
      res.json(drivers);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to find nearby drivers', 500);
    }
  },
}; 