import { Router } from 'express';
import { rideRoutes } from './ride.routes';

const router = Router();

router.use('/rides', rideRoutes);

export { router as routes }; 