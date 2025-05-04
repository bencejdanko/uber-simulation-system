import { Router } from 'express';
import { rideController } from '../controllers/ride.controller';
import { verifyToken, checkRole } from '../middleware/auth.middleware';
import { userRateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import { createRideSchema, updateRideStatusSchema } from '../schemas/ride.schema';

const router = Router();

// Create a new ride
router.post(
  '/',
  verifyToken,
  checkRole(['CUSTOMER']),
  userRateLimiter(10),
  validateRequest(createRideSchema),
  rideController.createRide
);

// Find nearby drivers
router.get(
  '/nearby-drivers',
  verifyToken,
  userRateLimiter(5),
  rideController.findNearbyDrivers
);

// Get ride by ID
router.get(
  '/:id',
  verifyToken,
  userRateLimiter(30),
  rideController.getRide
);

// Update ride status
router.put(
  '/:id/status',
  verifyToken,
  checkRole(['DRIVER']),
  userRateLimiter(50),
  validateRequest(updateRideStatusSchema),
  rideController.acceptRide
);

// Cancel ride
router.post(
  '/:id/cancel',
  verifyToken,
  userRateLimiter(20),
  rideController.cancelRide
);

export const rideRoutes = router; 