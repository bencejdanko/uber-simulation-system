import { z } from 'zod';

// GeoJSON "Point" structure
const coordinateSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([
    z.number().min(-180).max(180), // longitude
    z.number().min(-90).max(90)    // latitude
  ])
});

// POST /rides — Create Ride
export const createRideSchema = z.object({
  pickupLocation: coordinateSchema,
  dropoffLocation: coordinateSchema,
  vehicleType: z.enum(['STANDARD', 'PREMIUM', 'LUXURY']).optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'CASH']).optional(),
  customerId: z.string(), // injected from req.user.sub
  estimatedFare: z.number().positive().optional(),
  actualFare: z.number().positive().optional(),
});

// PUT /rides/:id/status — Update Ride Status
export const updateRideStatusSchema = z.object({
  status: z.enum(['REQUESTED', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});

// PATCH /rides/:id — Update any ride fields
export const updateRideSchema = z.object({
  status: z.enum(['REQUESTED', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  driverId: z.string().optional(),
  vehicleType: z.enum(['STANDARD', 'PREMIUM', 'LUXURY']).optional(),
  paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'PAYPAL']).optional(),
  estimatedFare: z.number().positive().optional(),
  actualFare: z.number().positive().optional(),
  cancellationReason: z.string().min(1).max(500).optional(),
});

// PUT /rides/:id/complete — Mark ride complete
export const completeRideSchema = z.object({}); // No body needed, so use an empty object

// POST /rides/:id/cancel — Cancel a ride with optional reason
export const cancelRideSchema = z.object({
  reason: z.string().min(1).max(500).optional()
});

// GET /drivers/nearby — Find nearby drivers (from query params)
export const findNearbyDriversSchema = z.object({
  latitude: z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number),
  longitude: z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number),
  radius: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional()
    .default('5000'), // in meters
});

// GET /rides/search — Search for rides
export const searchRidesSchema = z.object({
  status: z.enum(['REQUESTED', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  latitude: z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number).optional(),
  longitude: z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number).optional(),
  radius: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional()
    .default('5000'), // in meters
  customerId: z.string().optional(),
  driverId: z.string().optional(),
});