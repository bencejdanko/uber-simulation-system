import { Router } from 'express';
import { rideController } from '../controllers/ride.controller';
import { verifyToken, checkRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { 
  createRideSchema, 
  getRideSchema, 
  listRidesSchema,
  findNearbyDriversSchema,
  cancelRideSchema 
} from '../validators/ride.validator';
import { 
  highPriorityLimiter, 
  moderatePriorityLimiter, 
  veryHighPriorityLimiter,
  userRateLimiter 
} from '../middleware/rateLimiter';

const router = Router();

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Create a new ride (only customers)
router.post('/', 
  highPriorityLimiter,
  userRateLimiter(10), // 10 requests per 15 minutes per user
  checkRole(['CUSTOMER']), 
  validateRequest(createRideSchema), 
  rideController.createRide
);

// Get ride details (customers, drivers, and admins)
router.get('/:rideId', 
  moderatePriorityLimiter,
  userRateLimiter(30), // 30 requests per 15 minutes per user
  validateRequest(getRideSchema), 
  rideController.getRide
);

// List rides (customers, drivers, and admins)
router.get('/', 
  moderatePriorityLimiter,
  userRateLimiter(50), // 50 requests per 15 minutes per user
  validateRequest(listRidesSchema), 
  rideController.listRides
);

// Cancel ride (customers, drivers, and admins)
router.delete('/:rideId', 
  moderatePriorityLimiter,
  userRateLimiter(20), // 20 requests per 15 minutes per user
  validateRequest(cancelRideSchema), 
  rideController.cancelRide
);

// Find nearby drivers (only customers and admins)
router.get('/drivers/nearby', 
  veryHighPriorityLimiter,
  userRateLimiter(5), // 5 requests per 15 minutes per user
  checkRole(['CUSTOMER', 'ADMIN']), 
  validateRequest(findNearbyDriversSchema), 
  rideController.findNearbyDrivers
);

export default router; 