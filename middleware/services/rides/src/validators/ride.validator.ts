import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import Joi from 'joi';
import { z } from 'zod';

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

const locationSchema = Joi.object({
  latitude: Joi.number().required(),
  longitude: Joi.number().required()
});

const coordinateSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([
    z.number().min(-180).max(180), // longitude
    z.number().min(-90).max(90)    // latitude
  ])
});

export const createRideSchema = z.object({
  body: z.object({
    pickupLocation: coordinateSchema,
    dropoffLocation: coordinateSchema,
    vehicleType: z.enum(['STANDARD', 'PREMIUM', 'LUXURY']),
    paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'PAYPAL']),
    estimatedFare: z.number().positive().optional()
  })
});

export const getRideSchema = z.object({
  params: z.object({
    rideId: z.string().uuid()
  })
});

export const listRidesSchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    for_customer_id: z.string().uuid().optional(),
    for_driver_id: z.string().uuid().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional()
  })
});

export const findNearbyDriversSchema = z.object({
  query: z.object({
    latitude: z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number),
    longitude: z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number),
    radius: z.string().regex(/^\d+$/).transform(Number).optional().default('5000')
  })
});

export const cancelRideSchema = z.object({
  params: z.object({
    rideId: z.string().uuid()
  }),
  body: z.object({
    reason: z.string().min(1).max(500).optional()
  })
});

// export const rideValidator = {
//   createRide: {
//     body: {
//       passengerId: 'string',
//       pickupLocation: {
//         latitude: 'number',
//         longitude: 'number',
//       },
//       dropoffLocation: {
//         latitude: 'number',
//         longitude: 'number',
//       },
//     },
//   },

//   findNearbyDrivers: {
//     query: {
//       latitude: 'number',
//       longitude: 'number',
//       radius: 'number',
//     },
//   },
// }; 