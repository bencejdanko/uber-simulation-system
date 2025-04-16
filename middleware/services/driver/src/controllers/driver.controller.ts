import { Request, Response } from 'express';
import { DriverService } from '../services/driver.service';
import { DriverInput, DriverUpdate, DriverLocationUpdate } from '../types/driver.types';

class DriverController {
    private driverService: DriverService;

    constructor(driverService: DriverService) {
        this.driverService = driverService;
    }

    createDriver = async (req: Request, res: Response): Promise<void> => {
        try {
            const driverData = req.body as DriverInput;
            const newDriver = await this.driverService.createDriver(driverData);
            res.status(201).location(`/drivers/${newDriver.driverId}`).json(newDriver);
        } catch (error: any) {
            res.status(error.status || 500).json({
                error: error.code || 'internal_server_error',
                message: error.message || 'An unexpected error occurred.'
            });
        }
    }

    getDriverById = async (req: Request, res: Response): Promise<void> => {
        try {
            const driverId = req.params.driver_id;
            const driver = await this.driverService.getDriverById(driverId);
            res.status(200).json(driver);
        } catch (error: any) {
            res.status(error.status || 500).json({
                error: error.code || 'internal_server_error',
                message: error.message || 'An unexpected error occurred.'
            });
        }
    }

    updateDriver = async (req: Request, res: Response): Promise<void> => {
        try {
            const driverId = req.params.driver_id;
            const updatedData = req.body as DriverUpdate;
            const updatedDriver = await this.driverService.updateDriver(driverId, updatedData);
            res.status(200).json(updatedDriver);
        } catch (error: any) {
            res.status(error.status || 500).json({
                error: error.code || 'internal_server_error',
                message: error.message || 'An unexpected error occurred.'
            });
        }
    }

    deleteDriver = async (req: Request, res: Response): Promise<void> => {
        try {
            const driverId = req.params.driver_id;
            await this.driverService.deleteDriver(driverId);
            res.status(204).send();
        } catch (error: any) {
            res.status(error.status || 500).json({
                error: error.code || 'internal_server_error',
                message: error.message || 'An unexpected error occurred.'
            });
        }
    }

    listDrivers = async (req: Request, res: Response): Promise<void> => {
        try {
            const filters = req.query;
            const drivers = await this.driverService.listDrivers();
            res.status(200).json(drivers);
        } catch (error: any) {
            res.status(error.status || 500).json({
                error: error.code || 'internal_server_error',
                message: error.message || 'An unexpected error occurred.'
            });
        }
    }

    updateDriverLocation = async (req: Request, res: Response): Promise<void> => {
        try {
            const driverId = req.params.driver_id;
            const { latitude, longitude, timestamp } = req.body;
            const updatedDriver = await this.driverService.updateDriverLocation(driverId, { 
                latitude, 
                longitude, 
                timestamp 
            } as DriverLocationUpdate);
            res.status(200).json(updatedDriver);
        } catch (error: any) {
            res.status(error.status || 500).json({
                error: error.code || 'internal_server_error',
                message: error.message || 'An unexpected error occurred.'
            });
        }
    }
}

export default DriverController;