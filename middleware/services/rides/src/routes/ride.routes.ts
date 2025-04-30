import { Router } from 'express';
import { rideController } from '../controllers/ride.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createRideSchema, getRideSchema, listRidesSchema } from '../validators/ride.validator';

const router = Router();

// Create a new ride
router.post('/', validateRequest(createRideSchema), rideController.createRide);

// Get ride details
router.get('/:rideId', validateRequest(getRideSchema), rideController.getRide);

// List rides with filters
router.get('/', validateRequest(listRidesSchema), rideController.listRides);

// Cancel a ride
router.delete('/:rideId', validateRequest(getRideSchema), rideController.cancelRide);

// Find nearby drivers
router.get('/drivers/nearby', rideController.findNearbyDrivers);

export { router as rideRoutes }; 