// src/routes/admin.routes.js (or wherever you define your routes)
const express = require('express');
const router = express.Router();
const StatisticsController = require('../controllers/statistics.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeAdmin } = require('../middlewares/role.middleware');

// Apply authentication and admin authorization to all routes
router.use(authenticate, authorizeAdmin);

// GET /api/admin/statistics - Get aggregated statistics based on query parameters
router.get('/', StatisticsController.getStatistics);

// GET /api/admin/statistics/overview - Get overview statistics for admin dashboard
router.get('/overview', StatisticsController.getOverviewStats);

// GET /api/admin/statistics/rides-by-hour - Get ride distribution by hour
router.get('/rides-by-hour', StatisticsController.getRidesByHour);

// GET /api/admin/statistics/rides-by-city - Get ride distribution by city
router.get('/rides-by-city', StatisticsController.getRidesByCity);

module.exports = router;
