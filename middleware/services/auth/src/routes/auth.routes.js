const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Admin login route
router.post('/admin/login', authController.adminLogin);

// Export the router
module.exports = router; 