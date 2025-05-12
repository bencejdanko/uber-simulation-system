// src/routes/admin.routes.js (or wherever you define your routes)
const express = require('express');
const { getStatistics } = require('../controllers/statistics.controller');
const auth = require('../middlewares/auth');

const router = express.Router();

// Example route for statistics
router.get('/', getStatistics);

module.exports = router;
