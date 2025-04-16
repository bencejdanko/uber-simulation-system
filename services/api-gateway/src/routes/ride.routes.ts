import { Router } from 'express';
import { rideController } from '../controllers/ride.controller';

const router = Router();

// POST /api/v1/rides - For ride requests
router.post('/', rideController.requestRide);

// POST /api/v1/rides/:id/complete - For ride completion
router.post('/:id/complete', rideController.completeRide);

export default router;