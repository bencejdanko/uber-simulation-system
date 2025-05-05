import DriverModel, { IDriver } from "../models/driver.model";
import { DriverInput, DriverUpdate, DriverLocationUpdate } from '../types/driver.types';
import { getRedisClient } from '../config/redis'; // Import Redis client getter
import logger from '../config/logger'; // Import logger

const CACHE_TTL_SECONDS = 60; // Cache results for 60 seconds

export class DriverService {
    /**
     * Create a new driver in the database
     */
    public async createDriver(driverInput: DriverInput): Promise<IDriver> {
        const newDriver = new DriverModel({
            _id: driverInput.driverId, // Use driverId as _id in Mongoose model
            firstName: driverInput.firstName,
            lastName: driverInput.lastName,
            email: driverInput.email,
            phoneNumber: driverInput.phoneNumber,
            address: {
                street: driverInput.address.street,
                city: driverInput.address.city,
                state: driverInput.address.state,
                zipCode: driverInput.address.zipCode
            },
            carDetails: {
                make: driverInput.carDetails.make,
                model: driverInput.carDetails.model,
                year: driverInput.carDetails.year,
                color: driverInput.carDetails.color,
                licensePlate: driverInput.carDetails.licensePlate
            },
            introduction: driverInput.introduction || {}
        });

        return await newDriver.save();
    }

    /**
     * Get a driver by ID
     */
    public async getDriverById(driverId: string): Promise<IDriver | null> {
        try {
            const driver = await DriverModel.findById(driverId);
            return driver;
        } catch (error) {
            // Handle CastError (invalid ID format)
            if ((error as any).name === 'CastError') {
                return null;
            }
            throw error;
        }
    }

    /**
     * Update a driver's information and invalidate cache
     */
    public async updateDriver(driverId: string, driverUpdate: DriverUpdate): Promise<IDriver | null> {
        const updateData: Partial<IDriver> = {};
        
        // Only add fields that are present in the update
        if (driverUpdate.firstName) updateData.firstName = driverUpdate.firstName;
        if (driverUpdate.lastName) updateData.lastName = driverUpdate.lastName;
        if (driverUpdate.email) updateData.email = driverUpdate.email;
        if (driverUpdate.phoneNumber) updateData.phoneNumber = driverUpdate.phoneNumber;
        
        // Handle nested objects
        if (driverUpdate.address) {
            updateData.address = { $set: {} } as any;
            if (driverUpdate.address.street) (updateData.address as any).$set.street = driverUpdate.address.street;
            if (driverUpdate.address.city) (updateData.address as any).$set.city = driverUpdate.address.city;
            if (driverUpdate.address.state) (updateData.address as any).$set.state = driverUpdate.address.state;
            if (driverUpdate.address.zipCode) (updateData.address as any).$set.zipCode = driverUpdate.address.zipCode;
        }
        
        if (driverUpdate.carDetails) {
            updateData.carDetails = { $set: {} } as any;
            if (driverUpdate.carDetails.make) (updateData.carDetails as any).$set.make = driverUpdate.carDetails.make;
            if (driverUpdate.carDetails.model) (updateData.carDetails as any).$set.model = driverUpdate.carDetails.model;
            if (driverUpdate.carDetails.year) (updateData.carDetails as any).$set.year = driverUpdate.carDetails.year;
            if (driverUpdate.carDetails.color) (updateData.carDetails as any).$set.color = driverUpdate.carDetails.color;
            if (driverUpdate.carDetails.licensePlate) (updateData.carDetails as any).$set.licensePlate = driverUpdate.carDetails.licensePlate;
        }
        
        if (driverUpdate.introduction) {
            updateData.introduction = { $set: {} } as any;
            if (driverUpdate.introduction.imageUrl) (updateData.introduction as any).$set.imageUrl = driverUpdate.introduction.imageUrl;
            if (driverUpdate.introduction.videoUrl) (updateData.introduction as any).$set.videoUrl = driverUpdate.introduction.videoUrl;
        }
        
        if (driverUpdate.rating !== undefined) updateData.rating = driverUpdate.rating;
        
        // Update the timestamp
        updateData.updatedAt = new Date();
        
        // Use findByIdAndUpdate to update the document
        const updatedDriver = await DriverModel.findByIdAndUpdate(
            driverId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (updatedDriver) {
            await this.invalidateListCache(); // Invalidate cache on successful update
        }
        return updatedDriver;
    }

    /**
     * Update a driver's location and invalidate cache
     */
    public async updateDriverLocation(driverId: string, locationUpdate: DriverLocationUpdate): Promise<IDriver | null> {
        // Update using GeoJSON format which MongoDB expects
        const updateData = {
            currentLocation: {
                type: 'Point',
                coordinates: [locationUpdate.longitude, locationUpdate.latitude], // Note order: [longitude, latitude]
                timestamp: new Date(locationUpdate.timestamp)
            },
            updatedAt: new Date()
        };
        
        const updatedDriver = await DriverModel.findByIdAndUpdate(
            driverId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (updatedDriver) {
            await this.invalidateListCache(); // Invalidate cache on successful update
        }
        return updatedDriver;
    }

    /**
     * Delete a driver and invalidate cache
     */
    public async deleteDriver(driverId: string): Promise<boolean> {
        try {
            const result = await DriverModel.findByIdAndDelete(driverId);
            const deleted = result !== null;
            if (deleted) {
                await this.invalidateListCache(); // Invalidate cache on successful delete
            }
            return deleted;
        } catch (error) {
            // Handle CastError (invalid ID format)
            if ((error as any).name === 'CastError') {
                return false;
            }
            throw error;
        }
    }

    /**
     * List drivers with optional filtering and pagination, using cache.
     */
    public async listDrivers(limit: number = 50, skip: number = 0, filters: { [key: string]: any } = {}): Promise<IDriver[]> {
        const redisClient = getRedisClient();
        // Create a stable cache key based on filters, limit, and skip
        const filterKey = Object.entries(filters).sort().map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(':');
        const cacheKey = `drivers:list:${filterKey}:limit=${limit}:skip=${skip}`;

        try {
            // 1. Check cache first
            const cachedResult = await redisClient.get(cacheKey);
            if (cachedResult) {
                logger.info(`Cache hit for key: ${cacheKey}`);
                return JSON.parse(cachedResult);
            }

            logger.info(`Cache miss for key: ${cacheKey}. Querying database.`);
            // 2. If cache miss, query database
            const query = DriverModel.find(filters).limit(limit).skip(skip);
            const drivers = await query.exec();

            // 3. Store result in cache
            // Use SETEX for atomic set-with-expiry
            await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(drivers));
            logger.info(`Stored results in cache for key: ${cacheKey}`);

            return drivers;
        } catch (error) {
            logger.error(`Error in listDrivers (cache key: ${cacheKey}):`, error);
            // Fallback: If cache fails, try querying DB directly (optional, depends on desired resilience)
            try {
                logger.warn(`Cache operation failed for ${cacheKey}. Attempting direct DB query.`);
                const query = DriverModel.find(filters).limit(limit).skip(skip);
                return await query.exec();
            } catch (dbError) {
                logger.error(`Direct DB query also failed for listDrivers (filters: ${JSON.stringify(filters)}):`, dbError);
                return []; // Return empty array on error
            }
        }
    }

    /**
     * Invalidate cache related to driver lists when a driver is updated or deleted.
     * This is a simple approach; more granular invalidation might be needed.
     */
    private async invalidateListCache(): Promise<void> {
        try {
            const redisClient = getRedisClient();
            const keys = await redisClient.keys('drivers:list:*'); // Find all list cache keys
            if (keys.length > 0) {
                await redisClient.del(keys);
                logger.info(`Invalidated ${keys.length} list cache keys.`);
            }
        } catch (error) {
            logger.error('Failed to invalidate list cache:', error);
        }
    }
    
    /**
     * Find drivers near a location
     */
    public async findNearbyDrivers(latitude: number, longitude: number, maxDistance: number = 5000): Promise<IDriver[]> {
        return await DriverModel.find({
            'currentLocation.type': 'Point',
            'currentLocation.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude] // Note order: [longitude, latitude]
                    },
                    $maxDistance: maxDistance // in meters
                }
            }
        });
    }

    /**
     * Search for drivers by name (first name or last name)
     */
    public async searchDriversByName(name: string): Promise<IDriver[]> {
        const searchRegex = new RegExp(name, 'i'); // case-insensitive search
        return await DriverModel.find({
            $or: [
                { firstName: searchRegex },
                { lastName: searchRegex }
            ]
        });
    }
}