// src/routes/charts.routes.js
const express = require('express');
const router = express.Router();
const chartsController = require('../controllers/charts.controller');
const auth = require('../middlewares/auth');
// Route for fetching chart data
router.get('/', chartsController.getChartData);

module.exports = router;
