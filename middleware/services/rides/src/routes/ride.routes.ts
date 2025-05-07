import { Router } from 'express';
import { rideController } from '../controllers/ride.controller';
import { verifyToken, checkRole } from '../middleware/auth.middleware';
import { userRateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import { createRideSchema, updateRideStatusSchema } from '../schemas/ride.schema';

const router = Router();

// Apply token verification middleware to all routes
router.use(verifyToken);

// Create a new ride
router.post(
  '/',
  (req, res, next) => {
    console.log('🚗 Raw request body before validation:', JSON.stringify(req.body, null, 2));
    next();
  },
  validateRequest(createRideSchema),
  rideController.createRide
);

// Find nearby drivers
router.get(
  '/nearby-drivers',
  rideController.findNearbyDrivers
);

// Get ride by ID
router.get(
  '/:id',
  rideController.getRide
);

// Update ride status
router.put(
  '/:id/status',
  checkRole(['DRIVER']),
  validateRequest(updateRideStatusSchema),
  rideController.acceptRide
);

// Cancel ride
router.post(
  '/:id/cancel',
  rideController.cancelRide
);

export const rideRoutes = router;