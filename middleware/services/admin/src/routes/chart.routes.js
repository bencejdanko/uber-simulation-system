// src/routes/charts.routes.js
const express = require('express');
const router = express.Router();
const ChartController = require('../controllers/charts.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeAdmin } = require('../middlewares/role.middleware');

// Apply authentication and admin authorization to all routes
router.use(authenticate, authorizeAdmin);

// GET /api/admin/charts - Get chart data based on query parameters
router.get('/', ChartController.getChartData);

// GET /api/admin/charts/rides-by-city - Get ride distribution by city
router.get('/rides-by-city', ChartController.getRidesByCity);

// GET /api/admin/charts/rides-by-hour - Get hourly ride distribution
router.get('/rides-by-hour', ChartController.getRidesByHour);

module.exports = router;
