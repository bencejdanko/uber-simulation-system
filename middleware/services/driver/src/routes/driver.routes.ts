import { Router } from 'express';
import DriverController from '../controllers/driver.controller';
import { DriverService } from '../services/driver.service';
import { 
  validateDriverInput, 
  validateDriverUpdate, 
  validateLocationUpdate,
  validateNearbySearch 
} from '../validators/driver.validator';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const driverService = new DriverService();
const driverController = new DriverController(driverService);

// Health check endpoint - no authentication required
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Create Driver - authentication first, then validation
router.post('/', authenticate, validateDriverInput, driverController.createDriver);

// List and Search Drivers
router.get('/', authenticate, driverController.listDrivers);

// Search Drivers by name
router.get('/search', authenticate, driverController.searchDrivers);

// Find Nearby Drivers - authentication first, then validation
router.get('/nearby', authenticate, validateNearbySearch, driverController.findNearbyDrivers);

// Get Driver by ID
router.get('/:driver_id', authenticate, driverController.getDriverById);

// Update Driver Information - authentication first, then validation
router.patch('/:driver_id', authenticate, validateDriverUpdate, driverController.updateDriver);

// Delete Driver
router.delete('/:driver_id', authenticate, driverController.deleteDriver);

// Update Driver Location - authentication first, then validation
router.patch('/:driver_id/location', authenticate, validateLocationUpdate, driverController.updateDriverLocation);

export default router;