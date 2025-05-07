import { Router } from 'express';
import { rideController } from '../controllers/ride.controller';
import {  checkRole } from '../middleware/auth.middleware';
import { userRateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import { createRideSchema, updateRideStatusSchema } from '../schemas/ride.schema';

const router = Router();

// Create a new ride
router.post(
  '/',
  //checkRole(['CUSTOMER']),
  //userRateLimiter(10),
  validateRequest(createRideSchema),
  rideController.createRide
);

// Find nearby drivers
router.get(
  '/nearby-drivers',
  //userRateLimiter(5),
  rideController.findNearbyDrivers
);

// Get ride by ID
router.get(
  '/:id',
  //userRateLimiter(30),
  rideController.getRide
);

// Update ride status
router.put(
  '/:id/status',
  checkRole(['DRIVER']),
  //userRateLimiter(50),
  validateRequest(updateRideStatusSchema),
  rideController.acceptRide
);

// Cancel ride
router.post(
  '/:id/cancel',
  //userRateLimiter(20),
  rideController.cancelRide
);

export const rideRoutes = router; 