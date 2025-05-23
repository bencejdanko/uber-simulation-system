import { Router } from 'express';
import DriverController from '../controllers/driver.controller';
import { 
  validateDriverUpdate, 
  validateLocationUpdate,
  validateNearbySearch 
} from '../validators/driver.validator';

const createDriverRoutes = (driverController: DriverController): Router => {
    const router = Router();

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

    return router;
};

export default createDriverRoutes;