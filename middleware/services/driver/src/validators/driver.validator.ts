import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

const addressSchema = z.object({
  street: z.string().nonempty(),
  city: z.string().nonempty(),
  state: z.string().regex(/^(?:[A-Z]{2}|(?:Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming))$/),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
});

const carDetailsSchema = z.object({
  make: z.string().nonempty(),
  model: z.string().nonempty(),
  year: z.number().int().gte(1886), // The year the first car was invented
  color: z.string().nonempty(),
  licensePlate: z.string().nonempty(),
});

const reviewSchema = z.object({
  reviewId: z.string().nonempty(),
  customerId: z.string().regex(/^\d{3}-\d{2}-\d{4}$/), // SSN format
  rating: z.number().int().gte(1).lte(5),
  comment: z.string().optional(),
  timestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/).optional(), // ISO 8601 format
});

export const driverInputSchema = z.object({
  driverId: z.string().regex(/^\d{3}-\d{2}-\d{4}$/), // SSN format
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  address: addressSchema,
  phoneNumber: z.string().nonempty(),
  email: z.string().email(),
  carDetails: carDetailsSchema,
  introduction: z.object({
    imageUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
  }).optional(),
});

// Create partial schemas for nested objects
const partialAddressSchema = addressSchema.partial();
const partialCarDetailsSchema = carDetailsSchema.partial();

// Updated driverUpdateSchema that properly handles partial nested objects
export const driverUpdateSchema = z.object({
  driverId: z.string().regex(/^\d{3}-\d{2}-\d{4}$/).optional(),
  firstName: z.string().nonempty().optional(),
  lastName: z.string().nonempty().optional(),
  address: partialAddressSchema.optional(),
  phoneNumber: z.string().nonempty().optional(),
  email: z.string().email().optional(),
  carDetails: partialCarDetailsSchema.optional(),
  introduction: z.object({
    imageUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
  }).optional(),
});

// Updated to match MongoDB's geospatial format
export const locationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/).optional(),
});

// Updated geo location schema for MongoDB
export const geoLocationSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([
    z.number().min(-180).max(180), // longitude
    z.number().min(-90).max(90),   // latitude
  ]),
  timestamp: z.date()
});

export const driverSchema = driverInputSchema.extend({
  rating: z.number().gte(1).lte(5).optional(),
  reviews: z.array(reviewSchema).optional(),
  ridesHistory: z.array(z.object({
    rideId: z.string().nonempty(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/), // ISO 8601 format
    fare: z.number(),
  })).optional(),
  currentLocation: geoLocationSchema.optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string())
});

// Validator middleware functions
export const validateDriverInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    driverInputSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid driver data',
        details: error.errors
      });
    }
    next(error);
  }
};

export const validateDriverUpdate = (req: Request, res: Response, next: NextFunction) => {
  try {
    driverUpdateSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid driver update data',
        details: error.errors
      });
    }
    next(error);
  }
};

export const validateLocationUpdate = (req: Request, res: Response, next: NextFunction) => {
  try {
    locationUpdateSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid location data',
        details: error.errors
      });
    }
    next(error);
  }
};

// Validator for searching nearby drivers
export const validateNearbySearch = (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      latitude: z.string().transform(val => parseFloat(val)),
      longitude: z.string().transform(val => parseFloat(val)),
      maxDistance: z.string().transform(val => parseFloat(val)).optional()
    });
    
    schema.parse(req.query);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid location search parameters',
        details: error.errors
      });
    }
    next(error);
  }
};