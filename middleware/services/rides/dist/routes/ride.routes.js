"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rideRoutes = void 0;
const express_1 = require("express");
const ride_controller_1 = require("../controllers/ride.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validateRequest_1 = require("../middleware/validateRequest");
const ride_schema_1 = require("../schemas/ride.schema");
const router = (0, express_1.Router)();
// Create a new ride
router.post('/', auth_middleware_1.verifyToken, (0, auth_middleware_1.checkRole)(['CUSTOMER']), (0, rateLimiter_1.userRateLimiter)(10), (0, validateRequest_1.validateRequest)(ride_schema_1.createRideSchema), ride_controller_1.rideController.createRide);
// Get ride by ID
router.get('/:id', auth_middleware_1.verifyToken, (0, rateLimiter_1.userRateLimiter)(30), ride_controller_1.rideController.getRide);
// Update ride status
router.put('/:id/status', auth_middleware_1.verifyToken, (0, auth_middleware_1.checkRole)(['DRIVER']), (0, rateLimiter_1.userRateLimiter)(50), (0, validateRequest_1.validateRequest)(ride_schema_1.updateRideStatusSchema), ride_controller_1.rideController.acceptRide);
// Cancel ride
router.post('/:id/cancel', auth_middleware_1.verifyToken, (0, rateLimiter_1.userRateLimiter)(20), ride_controller_1.rideController.cancelRide);
// Find nearby drivers
router.get('/nearby-drivers', auth_middleware_1.verifyToken, (0, rateLimiter_1.userRateLimiter)(5), ride_controller_1.rideController.findNearbyDrivers);
exports.rideRoutes = router;
