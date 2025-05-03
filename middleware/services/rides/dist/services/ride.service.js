"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RideService = void 0;
const ride_model_1 = require("../models/ride.model");
const redis_service_1 = require("./redis.service");
const errorHandler_1 = require("../middleware/errorHandler");
class RideService {
    constructor() {
        this.redisService = redis_service_1.RedisService.getInstance();
    }
    static getInstance() {
        if (!RideService.instance) {
            RideService.instance = new RideService();
        }
        return RideService.instance;
    }
    async createRide(rideData) {
        try {
            const ride = new ride_model_1.Ride(rideData);
            await ride.save();
            await this.redisService.cacheRide(ride);
            return ride;
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to create ride', 500);
        }
    }
    async getRideById(rideId) {
        try {
            // Try to get from cache first
            const cachedRide = await this.redisService.getCachedRide(rideId);
            if (cachedRide) {
                return cachedRide;
            }
            // If not in cache, get from database
            const ride = await ride_model_1.Ride.findById(rideId);
            if (ride) {
                await this.redisService.cacheRide(ride);
            }
            return ride;
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to get ride', 500);
        }
    }
    async getRidesByUser(userId) {
        try {
            // Try to get from cache first
            const cachedRides = await this.redisService.getCachedRideList(userId);
            if (cachedRides) {
                return cachedRides;
            }
            // If not in cache, get from database
            const rides = await ride_model_1.Ride.find({ userId });
            if (rides.length > 0) {
                await this.redisService.cacheRideList(userId, rides);
            }
            return rides;
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to get user rides', 500);
        }
    }
    async listRides(filters) {
        try {
            const { status, customerId, driverId, page = 1, limit = 10 } = filters;
            const query = {};
            if (status)
                query.status = status;
            if (customerId)
                query.customerId = customerId;
            if (driverId)
                query.driverId = driverId;
            const skip = (page - 1) * limit;
            const [rides, total] = await Promise.all([
                ride_model_1.Ride.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                ride_model_1.Ride.countDocuments(query)
            ]);
            return { rides, total };
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to list rides', 500);
        }
    }
    async updateRide(rideId, updateData) {
        try {
            const ride = await ride_model_1.Ride.findByIdAndUpdate(rideId, { $set: updateData }, { new: true });
            if (ride) {
                await this.redisService.cacheRide(ride);
            }
            return ride;
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to update ride', 500);
        }
    }
    async cancelRide(rideId, reason) {
        try {
            const ride = await ride_model_1.Ride.findByIdAndUpdate(rideId, {
                $set: {
                    status: 'CANCELLED',
                    cancellationReason: reason
                }
            }, { new: true });
            if (ride) {
                await this.redisService.invalidateRide(rideId);
            }
            return ride;
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to cancel ride', 500);
        }
    }
    async findNearbyDrivers(latitude, longitude, radius = 5000) {
        try {
            return await this.redisService.findNearbyDrivers(latitude, longitude, radius);
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to find nearby drivers', 500);
        }
    }
    async updateDriverLocation(driverId, location) {
        try {
            await this.redisService.cacheDriverLocation(driverId, location);
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to update driver location', 500);
        }
    }
    async updateDriverAvailability(driverId, isAvailable) {
        try {
            if (!isAvailable) {
                await this.redisService.invalidateDriverLocation(driverId);
            }
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to update driver availability', 500);
        }
    }
}
exports.RideService = RideService;
