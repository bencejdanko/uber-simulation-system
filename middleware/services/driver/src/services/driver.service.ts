import DriverModel, { IDriver } from "../models/driver.model";
import { DriverInput, DriverUpdate, DriverLocationUpdate } from '../types/driver.types';
import { getRedisClient } from '../config/redis'; // Import Redis client getter
import logger from '../config/logger'; // Import logger
import config from '../config'; // Import the main config
import KafkaService from './kafka.service'; // Import KafkaService

const CACHE_TTL_SECONDS = 60; // Cache results for 60 seconds

export class DriverService {
    private kafkaService: KafkaService; // Add KafkaService instance variable

    // Modify constructor to accept KafkaService
    constructor(kafkaService: KafkaService) {
        this.kafkaService = kafkaService;
    }

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

        // Invalidate cache only if enabled and driver creation is successful
        const savedDriver = await newDriver.save();
        if (savedDriver) {
            await this.invalidateListCache(); // Invalidate cache on successful create
        }
        return savedDriver; // Return the saved driver
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
            // Optionally, produce a Kafka message for general driver updates as well
            // if (config.kafka.enabled) {
            //     try {
            //         await this.kafkaService.sendMessage(config.kafka.driver_updates_topic || 'driver_updates', {
            //             driverId,
            //             updateData, // Send the specific fields that were updated
            //             timestamp: new Date(),
            //         });
            //         logger.info(`Produced driver update message for driver ${driverId} to Kafka topic ${config.kafka.driver_updates_topic || 'driver_updates'}`);
            //     } catch (kafkaError) {
            //         logger.error(`Failed to send driver update message for driver ${driverId} to Kafka:`, kafkaError);
            //         // Decide if this should be a critical error or just logged
            //     }
            // }
        }
        return updatedDriver;
    }

    /**
     * Produce a message to Kafka for driver location updates.
     */
    public async updateDriverLocation(driverId: string, locationUpdate: DriverLocationUpdate): Promise<void> { // Changed return type
        // Check if Kafka is enabled in config
        if (!config.kafka.enabled) {
            logger.warn('Kafka is disabled. Using raw DB writes.');
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
            return 
        }

        // Construct the message payload
        const messagePayload = {
            driverId: driverId,
            latitude: locationUpdate.latitude,
            longitude: locationUpdate.longitude,
            timestamp: locationUpdate.timestamp // Use the timestamp from the update
        };

        try {
            // Send the message to the configured Kafka topic
            await this.kafkaService.sendMessage(
                config.kafka.location_updates_topic,
                messagePayload
            );
            logger.info(`Produced location update for driver ${driverId} to Kafka topic ${config.kafka.location_updates_topic}`);

            // Note: Database update and cache invalidation are removed as requested.
            // The consumer of this Kafka topic will be responsible for updating the database/cache.

        } catch (error) {
            logger.error(`Failed to send location update for driver ${driverId} to Kafka:`, error);
            // Depending on requirements, you might want to throw the error,
            // implement retries, or use a dead-letter queue.
            throw error; // Re-throw the error to indicate failure
        }
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
     * List drivers with optional filtering and pagination, using cache if enabled.
     */
    public async listDrivers(limit: number = 50, skip: number = 0, filters: { [key: string]: any } = {}): Promise<IDriver[]> {
        // Check if caching is enabled via config
        if (!config.redis.cacheEnabled) {
            logger.info('Driver service caching is disabled. Querying database directly.');
            try {
                const query = DriverModel.find(filters).limit(limit).skip(skip);
                return await query.exec();
            } catch (dbError) {
                logger.error(`Direct DB query failed for listDrivers (filters: ${JSON.stringify(filters)}):`, dbError);
                return []; // Return empty array on error
            }
        }

        // Proceed with caching logic if enabled
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
            // Fallback: If cache fails, try querying DB directly
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
     * Only attempts invalidation if caching is enabled.
     */
    private async invalidateListCache(): Promise<void> {
        // Only invalidate if caching is enabled
        if (!config.redis.cacheEnabled) {
            logger.info('Skipping cache invalidation as caching is disabled.');
            return;
        }
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