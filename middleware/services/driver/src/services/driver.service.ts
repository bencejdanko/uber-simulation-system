import DriverModel, { IDriver } from "../models/driver.model";
import { DriverInput, DriverUpdate, DriverLocationUpdate } from '../types/driver.types';

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
     * Update a driver's information
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
        return await DriverModel.findByIdAndUpdate(
            driverId,
            { $set: updateData },
            { new: true, runValidators: true }
        );
    }

    /**
     * Update a driver's location
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
        
        return await DriverModel.findByIdAndUpdate(
            driverId,
            { $set: updateData },
            { new: true, runValidators: true }
        );
    }

    /**
     * Delete a driver
     */
    public async deleteDriver(driverId: string): Promise<boolean> {
        try {
            const result = await DriverModel.findByIdAndDelete(driverId);
            return result !== null;
        } catch (error) {
            // Handle CastError (invalid ID format)
            if ((error as any).name === 'CastError') {
                return false;
            }
            throw error;
        }
    }

    /**
     * List all drivers with optional pagination
     */
    public async listDrivers(limit: number = 50, skip: number = 0): Promise<IDriver[]> {
        try {
            return await DriverModel.find().limit(limit).skip(skip);
        } catch (error) {
            // Return empty array on error rather than having the entire request fail
            console.error("Error listing drivers:", error);
            return [];
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