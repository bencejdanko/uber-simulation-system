import { Router } from 'express';
import { driverController } from '../controllers/driver.controller';

const router = Router();

// POST /api/v1/drivers/:id/location - For driver location updates
router.post('/:id/location', driverController.updateLocation);

export default router;