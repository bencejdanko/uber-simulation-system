import { Driver } from '../models/driver.model';
import { DriverInput, DriverUpdate, DriverLocationUpdate } from '../types/driver.types';

export class DriverService {
    private drivers: Driver[] = [];

    public createDriver(driverInput: DriverInput): Driver {
        const newDriver: Driver = {
            ...driverInput,
            rating: 5.0, // Default rating for new drivers
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.drivers.push(newDriver);
        return newDriver;
    }

    public getDriverById(driverId: string): Driver | undefined {
        return this.drivers.find(driver => driver.driverId === driverId);
    }

    public updateDriver(driverId: string, driverUpdate: DriverUpdate): Driver | undefined {
        const driverIndex = this.drivers.findIndex(driver => driver.driverId === driverId);
        if (driverIndex === -1) return undefined;

        const currentDriver = this.drivers[driverIndex];
        
        // Handle nested objects properly to maintain type safety
        const updatedDriver: Driver = {
            ...currentDriver,
            ...driverUpdate,
            // Handle nested objects that could be partial
            address: driverUpdate.address ? { ...currentDriver.address, ...driverUpdate.address } : currentDriver.address,
            carDetails: driverUpdate.carDetails ? { ...currentDriver.carDetails, ...driverUpdate.carDetails } : currentDriver.carDetails,
            updatedAt: new Date().toISOString()
        };
        
        this.drivers[driverIndex] = updatedDriver;
        return updatedDriver;
    }

    public updateDriverLocation(driverId: string, locationUpdate: DriverLocationUpdate): Driver | undefined {
        const driverIndex = this.drivers.findIndex(driver => driver.driverId === driverId);
        if (driverIndex === -1) return undefined;

        const currentDriver = this.drivers[driverIndex];
        const updatedDriver: Driver = {
            ...currentDriver,
            currentLocation: {
                latitude: locationUpdate.latitude,
                longitude: locationUpdate.longitude,
                timestamp: locationUpdate.timestamp
            },
            updatedAt: new Date().toISOString()
        };
        
        this.drivers[driverIndex] = updatedDriver;
        return updatedDriver;
    }

    public deleteDriver(driverId: string): boolean {
        const driverIndex = this.drivers.findIndex(driver => driver.driverId === driverId);
        if (driverIndex === -1) return false;

        this.drivers.splice(driverIndex, 1);
        return true;
    }

    public listDrivers(): Driver[] {
        return this.drivers;
    }
}