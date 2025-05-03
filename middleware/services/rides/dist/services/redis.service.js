"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const redis_1 = require("redis");
class RedisService {
    constructor() {
        this.isConnected = false;
        this.client = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        return new Error('Max reconnection attempts reached');
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });
        this.setupEventHandlers();
    }
    static getInstance() {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }
    setupEventHandlers() {
        this.client.on('connect', () => {
            console.log('Connected to Redis');
            this.isConnected = true;
        });
        this.client.on('error', (err) => {
            console.error('Redis error:', err);
            this.isConnected = false;
        });
        this.client.on('reconnecting', () => {
            console.log('Reconnecting to Redis...');
        });
        this.client.on('end', () => {
            console.log('Redis connection closed');
            this.isConnected = false;
        });
    }
    async connect() {
        if (this.isConnected) {
            return;
        }
        try {
            await this.client.connect();
        }
        catch (error) {
            console.error('Failed to connect to Redis:', error);
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await this.client.quit();
            this.isConnected = false;
        }
        catch (error) {
            console.error('Error disconnecting from Redis:', error);
            throw error;
        }
    }
    // Ride caching methods
    async cacheRide(ride) {
        if (!this.isConnected)
            return;
        try {
            const key = `ride:${ride._id}`;
            await this.client.set(key, JSON.stringify(ride), {
                EX: 3600 // 1 hour expiration
            });
        }
        catch (error) {
            console.error('Error caching ride:', error);
        }
    }
    async getCachedRide(rideId) {
        if (!this.isConnected)
            return null;
        try {
            const key = `ride:${rideId}`;
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error('Error getting cached ride:', error);
            return null;
        }
    }
    async invalidateRide(rideId) {
        if (!this.isConnected)
            return;
        try {
            const key = `ride:${rideId}`;
            await this.client.del(key);
        }
        catch (error) {
            console.error('Error invalidating ride cache:', error);
        }
    }
    // Driver location caching methods
    async cacheDriverLocation(driverId, location) {
        if (!this.isConnected)
            return;
        try {
            const key = `driver:location:${driverId}`;
            await this.client.set(key, JSON.stringify(location), {
                EX: 300 // 5 minutes expiration
            });
            // Update driver's location in the geospatial index
            await this.client.geoAdd('drivers:locations', {
                longitude: location.longitude,
                latitude: location.latitude,
                member: driverId
            });
        }
        catch (error) {
            console.error('Error caching driver location:', error);
        }
    }
    async getCachedDriverLocation(driverId) {
        if (!this.isConnected)
            return null;
        try {
            const key = `driver:location:${driverId}`;
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error('Error getting cached driver location:', error);
            return null;
        }
    }
    async findNearbyDrivers(latitude, longitude, radius = 5000) {
        if (!this.isConnected)
            return [];
        try {
            const results = await this.client.geoSearch('drivers:locations', {
                longitude,
                latitude
            }, {
                radius,
                unit: 'm'
            });
            return results;
        }
        catch (error) {
            console.error('Error finding nearby drivers:', error);
            return [];
        }
    }
    async invalidateDriverLocation(driverId) {
        if (!this.isConnected)
            return;
        try {
            const key = `driver:location:${driverId}`;
            await this.client.del(key);
            await this.client.zRem('drivers:locations', driverId);
        }
        catch (error) {
            console.error('Error invalidating driver location cache:', error);
        }
    }
    // Ride list caching methods
    async cacheRideList(userId, rides) {
        if (!this.isConnected)
            return;
        try {
            const key = `user:rides:${userId}`;
            await this.client.set(key, JSON.stringify(rides), {
                EX: 300 // 5 minutes expiration
            });
        }
        catch (error) {
            console.error('Error caching ride list:', error);
        }
    }
    async getCachedRideList(userId) {
        if (!this.isConnected)
            return null;
        try {
            const key = `user:rides:${userId}`;
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error('Error getting cached ride list:', error);
            return null;
        }
    }
    async invalidateRideList(userId) {
        if (!this.isConnected)
            return;
        try {
            const key = `user:rides:${userId}`;
            await this.client.del(key);
        }
        catch (error) {
            console.error('Error invalidating ride list cache:', error);
        }
    }
}
exports.RedisService = RedisService;
