const express = require('express');
const router = express.Router();
const DriverController = require('../controllers/driver.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeAdmin } = require('../middlewares/role.middleware');

// Apply authentication and admin authorization to all routes
router.use(authenticate, authorizeAdmin);

// GET /api/admin/drivers - Get all drivers with filtering and pagination
router.get('/', DriverController.getAllDrivers);

// GET /api/admin/drivers/stats - Get driver statistics
router.get('/stats', DriverController.getDriverStats);

// GET /api/admin/drivers/:id - Get a single driver
router.get('/:id', DriverController.getDriverById);

// POST /api/admin/drivers - Create a new driver
router.post('/', DriverController.createDriver);

// PUT /api/admin/drivers/:id - Update a driver
router.put('/:id', DriverController.updateDriver);

// DELETE /api/admin/drivers/:id - Delete a driver
router.delete('/:id', DriverController.deleteDriver);

module.exports = router;
