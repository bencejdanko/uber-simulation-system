import { Request, Response } from 'express';
import { DriverService } from '../services/driver.service';
import { DriverUpdate, DriverLocationUpdate } from '../types/driver.types';

class DriverController {
    private driverService: DriverService;

    constructor(driverService: DriverService) {
        this.driverService = driverService;
    }

    getDriverById = async (req: Request, res: Response): Promise<any> => {
        try {
            const driverId = req.params.driver_id;
            const driver = await this.driverService.getDriverById(driverId);
            if (!driver) {
                return res.status(404).json({ error: 'not_found', message: 'Driver not found' });
            }
            res.status(200).json(driver);
        } catch (error: any) {
            res.status(error.status || 500).json({
                error: error.code || 'internal_server_error',
                message: error.message || 'An unexpected error occurred.'
            });
        }
    }

    updateDriver = async (req: Request, res: Response): Promise<any> => {
        try {
            const driverId = req.params.driver_id;
            const updatedData = req.body as DriverUpdate;
            const updatedDriver = await this.driverService.updateDriver(driverId, updatedData);
            if (!updatedDriver) {
                return res.status(404).json({ error: 'not_found', message: 'Driver not found' });
            }
            res.status(200).json(updatedDriver);
        } catch (error: any) {
            res.status(error.status || 500).json({
                error: error.code || 'internal_server_error',
                message: error.message || 'An unexpected error occurred.'
            });
        }
    }

    deleteDriver = async (req: Request, res: Response): Promise<any> => {
        try {
            const driverId = req.params.driver_id;
            const deleted = await this.driverService.deleteDriver(driverId);
            if (!deleted) {
                return res.status(404).json({ error: 'not_found', message: 'Driver not found' });
            }
            res.status(204).send();
        } catch (error: any) {
            res.status(error.status || 500).json({
                error: error.code || 'internal_server_error',
                message: error.message || 'An unexpected error occurred.'
            });
        }
    }

    listDrivers = async (req: Request, res: Response): Promise<any> => {
        try {
            // Parse pagination parameters
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
            const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;

            // Extract filter parameters
            const filters: { [key: string]: any } = {};
            if (req.query.city) filters['address.city'] = req.query.city as string;
            if (req.query.state) filters['address.state'] = req.query.state as string;
            if (req.query.car_make) filters['carDetails.make'] = req.query.car_make as string;
            if (req.query.min_rating) {
                const rating = parseFloat(req.query.min_rating as string);
                if (!isNaN(rating)) {
                    filters.rating = { $gte: rating };
                }
            }

            const drivers = await this.driverService.listDrivers(limit, skip, filters);
            res.status(200).json(drivers);
        } catch (error: any) {
            res.status(error.status || 500).json({
                error: error.code || 'internal_server_error',
                message: error.message || 'An unexpected error occurred.'
            });
        }
    }

    updateDriverLocation = async (req: Request, res: Response): Promise<any> => {
        try {
            const driverId = req.params.driver_id;
            const { latitude, longitude, timestamp } = req.body;
            const updatedDriver = await this.driverService.updateDriverLocation(driverId, { 
                latitude, 
                longitude, 
                timestamp: timestamp || new Date().toISOString()
            } as DriverLocationUpdate);
            if (!updatedDriver) {
                return res.status(404).json({ error: 'not_found', message: 'Driver not found' });
            }
            res.status(200).json(updatedDriver);
        } catch (error: any) {
            res.status(error.status || 500).json({
                error: error.code || 'internal_server_error',
                message: error.message || 'An unexpected error occurred.'
            });
        }
    }

    findNearbyDrivers = async (req: Request, res: Response): Promise<any> => {
        try {
            const { latitude, longitude, maxDistance } = req.query;
            
            if (!latitude || !longitude) {
                return res.status(400).json({ 
                    error: 'invalid_request', 
                    message: 'latitude and longitude are required query parameters' 
                });
            }

            const lat = parseFloat(latitude as string);
            const lng = parseFloat(longitude as string);
            const distance = maxDistance ? parseFloat(maxDistance as string) : 5000; // default 5km
            
            if (isNaN(lat) || isNaN(lng) || isNaN(distance)) {
                return res.status(400).json({ 
                    error: 'invalid_request', 
                    message: 'latitude, longitude, and maxDistance must be valid numbers' 
                });
            }
            
            const nearbyDrivers = await this.driverService.findNearbyDrivers(lat, lng, distance);
            res.status(200).json(nearbyDrivers);
        } catch (error: any) {
            res.status(error.status || 500).json({
                error: error.code || 'internal_server_error',
                message: error.message || 'An unexpected error occurred.'
            });
        }
    }

    searchDrivers = async (req: Request, res: Response): Promise<any> => {
        try {
            const { name } = req.query;
            
            if (!name) {
                return res.status(400).json({ 
                    error: 'invalid_request', 
                    message: 'Name parameter is required for search' 
                });
            }
            
            const drivers = await this.driverService.searchDriversByName(name as string);
            res.status(200).json(drivers);
        } catch (error: any) {
            res.status(error.status || 500).json({
                error: error.code || 'internal_server_error',
                message: error.message || 'An unexpected error occurred.'
            });
        }
    }
}

export default DriverController;