"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rideController = void 0;
const app_1 = require("../app");
const kafka_service_1 = require("../services/kafka.service");
const ride_service_1 = require("../services/ride.service");
const errorHandler_1 = require("../middleware/errorHandler");
const kafkaService = kafka_service_1.KafkaService.getInstance();
const rideService = ride_service_1.RideService.getInstance();
exports.rideController = {
    async createRide(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            const rideData = {
                ...req.body,
                customerId: req.user.userId,
                status: 'REQUESTED'
            };
            // Create ride in database and cache
            const ride = await rideService.createRide(rideData);
            // Publish ride requested event
            await kafkaService.publishRideRequested(ride);
            // Find and notify nearby drivers using cached locations
            const nearbyDrivers = await rideService.findNearbyDrivers(ride.pickupLocation.latitude, ride.pickupLocation.longitude);
            for (const driverId of nearbyDrivers) {
                app_1.webSocketService.notifyNewRideRequest(ride, driverId);
            }
            res.status(202).json(ride);
        }
        catch (error) {
            next(error);
        }
    },
    async getRide(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            const { rideId } = req.params;
            const ride = await rideService.getRideById(rideId);
            if (!ride) {
                throw new errorHandler_1.AppError('Ride not found', 404);
            }
            // Check if user has access to this ride
            if (ride.customerId !== req.user.userId &&
                ride.driverId !== req.user.userId &&
                !req.user.roles.includes('ADMIN')) {
                throw new errorHandler_1.AppError('Access denied to this ride', 403);
            }
            res.json(ride);
        }
        catch (error) {
            next(error);
        }
    },
    async listRides(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            const { status, for_customer_id, for_driver_id, page, limit } = req.query;
            // If not admin, only show rides for the user
            if (!req.user.roles.includes('ADMIN')) {
                const rides = await rideService.getRidesByUser(req.user.userId);
                res.json({ rides, total: rides.length });
            }
            else {
                // Admin can see all rides or filter by customer/driver
                const filters = {
                    status: status,
                    customerId: for_customer_id,
                    driverId: for_driver_id,
                    page: Number(page) || 1,
                    limit: Number(limit) || 10
                };
                const { rides, total } = await rideService.listRides(filters);
                res.json({ rides, total });
            }
        }
        catch (error) {
            next(error);
        }
    },
    async cancelRide(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            const { rideId } = req.params;
            const { reason } = req.body;
            // Get ride from cache or database
            const ride = await rideService.getRideById(rideId);
            if (!ride) {
                throw new errorHandler_1.AppError('Ride not found', 404);
            }
            // Check if user has permission to cancel this ride
            if (ride.customerId !== req.user.userId &&
                ride.driverId !== req.user.userId &&
                !req.user.roles.includes('ADMIN')) {
                throw new errorHandler_1.AppError('Access denied to cancel this ride', 403);
            }
            // Update ride status and invalidate cache
            const updatedRide = await rideService.cancelRide(rideId, reason);
            if (!updatedRide) {
                throw new errorHandler_1.AppError('Failed to cancel ride', 500);
            }
            // Publish ride cancelled event
            await kafkaService.publishRideCancelled(updatedRide, reason);
            // Notify driver if assigned
            if (updatedRide.driverId) {
                app_1.webSocketService.notifyRideCancellation(updatedRide, updatedRide.driverId);
            }
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
    async findNearbyDrivers(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            // Only customers and admins can find nearby drivers
            if (!req.user.roles.includes('CUSTOMER') && !req.user.roles.includes('ADMIN')) {
                throw new errorHandler_1.AppError('Access denied', 403);
            }
            const { latitude, longitude, radius = 5000 } = req.query;
            // Use cached driver locations for faster response
            const drivers = await rideService.findNearbyDrivers(Number(latitude), Number(longitude), Number(radius));
            res.json({ drivers });
        }
        catch (error) {
            next(error);
        }
    },
    async updateDriverLocation(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            // Only drivers can update their location
            if (!req.user.roles.includes('DRIVER')) {
                throw new errorHandler_1.AppError('Access denied', 403);
            }
            const { latitude, longitude } = req.body;
            // Update driver location in cache
            await rideService.updateDriverLocation(req.user.userId, {
                latitude,
                longitude
            });
            // Publish driver location updated event
            await kafkaService.publishDriverLocationUpdated(req.user.userId, {
                latitude,
                longitude
            });
            res.json({ message: 'Driver location updated successfully' });
        }
        catch (error) {
            next(error);
        }
    },
    async acceptRide(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            // Only drivers can accept rides
            if (!req.user.roles.includes('DRIVER')) {
                throw new errorHandler_1.AppError('Access denied', 403);
            }
            const { rideId } = req.params;
            const ride = await rideService.getRideById(rideId);
            if (!ride) {
                throw new errorHandler_1.AppError('Ride not found', 404);
            }
            if (ride.status !== 'REQUESTED') {
                throw new errorHandler_1.AppError('Ride is not available for acceptance', 400);
            }
            const previousStatus = ride.status;
            const updatedRide = await rideService.updateRide(rideId, {
                status: 'ACCEPTED',
                driverId: req.user.userId
            });
            if (!updatedRide) {
                throw new errorHandler_1.AppError('Failed to accept ride', 500);
            }
            // Publish status update and driver assignment events
            await Promise.all([
                kafkaService.publishRideStatusUpdated(updatedRide, previousStatus),
                kafkaService.publishDriverAssigned(updatedRide)
            ]);
            // Notify customer
            app_1.webSocketService.notifyRideAccepted(updatedRide, updatedRide.customerId);
            res.json(updatedRide);
        }
        catch (error) {
            next(error);
        }
    },
    async completeRide(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            // Only drivers can complete rides
            if (!req.user.roles.includes('DRIVER')) {
                throw new errorHandler_1.AppError('Access denied', 403);
            }
            const { rideId } = req.params;
            const ride = await rideService.getRideById(rideId);
            if (!ride) {
                throw new errorHandler_1.AppError('Ride not found', 404);
            }
            if (ride.driverId !== req.user.userId) {
                throw new errorHandler_1.AppError('You are not assigned to this ride', 403);
            }
            if (ride.status !== 'IN_PROGRESS') {
                throw new errorHandler_1.AppError('Ride is not in progress', 400);
            }
            const previousStatus = ride.status;
            const updatedRide = await rideService.updateRide(rideId, {
                status: 'COMPLETED'
            });
            if (!updatedRide) {
                throw new errorHandler_1.AppError('Failed to complete ride', 500);
            }
            // Publish status update and completion events
            await Promise.all([
                kafkaService.publishRideStatusUpdated(updatedRide, previousStatus),
                kafkaService.publishRideCompleted(updatedRide)
            ]);
            // Notify customer
            app_1.webSocketService.notifyRideCompleted(updatedRide, updatedRide.customerId);
            res.json(updatedRide);
        }
        catch (error) {
            next(error);
        }
    }
};
