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
  (req, res, next) => { console.log('✅ hit 1: entering verifyToken'); next(); },
  verifyToken,
  (req, res, next) => { console.log('✅ hit 2: entering checkRole'); next(); },
  checkRole(['CUSTOMER']),
  (req, res, next) => { console.log('✅ hit 3: entering rateLimiter'); next(); },
  userRateLimiter(10),
  (req, res, next) => { console.log('✅ hit 4: entering validateRequest'); next(); },
  validateRequest(createRideSchema),
  (req, res, next) => { console.log('✅ hit 5: about to call controller'); next(); },
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