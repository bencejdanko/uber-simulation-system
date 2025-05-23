import { Router } from 'express';
import { rideController } from '../controllers/ride.controller';
import { verifyToken, checkRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  createRideSchema,
  updateRideStatusSchema,
  cancelRideSchema,
  findNearbyDriversSchema,
  searchRidesSchema,
  updateRideSchema
} from '../schemas/ride.schema';

const router = Router();

// 🔐 Apply token verification middleware to all routes
router.use(verifyToken);

// 🚗 Create a new ride
router.post(
  '/',
  (req, res, next) => {
    console.log('🚗 Raw request body before validation:', JSON.stringify(req.body, null, 2));
    next();
  },
  validateRequest({ body: createRideSchema }),
  rideController.createRide
);

// 📍 Find nearby drivers (with query validation)
router.get(
  '/nearby-drivers',
  validateRequest({ query: findNearbyDriversSchema }),
  rideController.findNearbyDrivers
);

// 🔍 Search for rides (with query validation)
router.get(
  '/search',
  validateRequest({ query: searchRidesSchema }),
  rideController.searchRides
);

// 📦 Get ride by ID
router.get('/:id', rideController.getRide);

// 🚦 Update ride status (driver-only route)
router.put(
  '/:id/status',
  checkRole(['DRIVER']),
  validateRequest({ body: updateRideStatusSchema }),
  rideController.acceptRide
);

// ❌ Cancel a ride (optional reason)
router.post(
  '/:id/cancel',
  validateRequest({ body: cancelRideSchema }),
  rideController.cancelRide
);

// 🔄 Update ride details (patch method for partial updates)
router.patch(
  '/:id',
  validateRequest({ body: updateRideSchema }),
  rideController.updateRide
);

export const rideRoutes = router;