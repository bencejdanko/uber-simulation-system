import { Router } from 'express';
import DriverController from '../controllers/driver.controller';
import { DriverService } from '../services/driver.service';
import { validateDriverInput, validateDriverUpdate, validateLocationUpdate } from '../validators/driver.validator';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const driverService = new DriverService();
const driverController = new DriverController(driverService);

// Create Driver
router.post('/', authenticate, validateDriverInput, driverController.createDriver);

// Get Driver by ID
router.get('/:driver_id', authenticate, driverController.getDriverById);

// Update Driver Information
router.patch('/:driver_id', authenticate, validateDriverUpdate, driverController.updateDriver);

// Delete Driver
router.delete('/:driver_id', authenticate, driverController.deleteDriver);

// List and Search Drivers
router.get('/', authenticate, driverController.listDrivers);

// Update Driver Location
router.patch('/:driver_id/location', authenticate, validateLocationUpdate, driverController.updateDriverLocation);

export default router;