import { Router } from 'express';
import DriverController from '../controllers/driver.controller';
import { DriverService } from '../services/driver.service';
import { 
  validateDriverInput, 
  validateDriverUpdate, 
  validateLocationUpdate,
  validateNearbySearch 
} from '../validators/driver.validator';

const router = Router();
const driverService = new DriverService();
const driverController = new DriverController(driverService);

// Health check endpoint - no authentication required
router.get('/health', (req, res) => {
  console.log("Headers:", req.headers); // Debug
  res.status(200).json({ status: 'healthy' });
});

// Create Driver - authentication first, then validation
router.post('/', validateDriverInput, driverController.createDriver);

// List and Search Drivers
router.get('/', driverController.listDrivers);

// Search Drivers by name
router.get('/search', driverController.searchDrivers);

// Find Nearby Drivers - authentication first, then validation
router.get('/nearby', validateNearbySearch, driverController.findNearbyDrivers);

// Get Driver by ID
router.get('/:driver_id', driverController.getDriverById);

// Update Driver Information - authentication first, then validation
router.patch('/:driver_id', validateDriverUpdate, driverController.updateDriver);

// Delete Driver
router.delete('/:driver_id', driverController.deleteDriver);

// Update Driver Location - authentication first, then validation
router.patch('/:driver_id/location', validateLocationUpdate, driverController.updateDriverLocation);

export default router;