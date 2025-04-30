import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { Joi } from 'joi';

export const validateRequest = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }
      next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Invalid request data', 400);
    }
  };
};

export const createRideSchema = Joi.object({
  passengerId: Joi.string().required(),
  pickupLocation: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
  }).required(),
  dropoffLocation: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
  }).required(),
});

export const getRideSchema = Joi.object({
  rideId: Joi.string().required(),
});

export const listRidesSchema = Joi.object({
  passengerId: Joi.string(),
  driverId: Joi.string(),
  status: Joi.string().valid('pending', 'accepted', 'in_progress', 'completed', 'cancelled'),
  startDate: Joi.date(),
  endDate: Joi.date(),
  page: Joi.number().min(1),
  limit: Joi.number().min(1).max(100),
});

export const rideValidator = {
  createRide: {
    body: {
      passengerId: 'string',
      pickupLocation: {
        latitude: 'number',
        longitude: 'number',
      },
      dropoffLocation: {
        latitude: 'number',
        longitude: 'number',
      },
    },
  },

  findNearbyDrivers: {
    query: {
      latitude: 'number',
      longitude: 'number',
      radius: 'number',
    },
  },
}; 