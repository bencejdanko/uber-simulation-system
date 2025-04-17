import { DriverService } from '../../src/services/driver.service';
import { Driver } from '../../src/types/driver.types';

describe('DriverService', () => {
    let driverService: DriverService;

    beforeEach(() => {
        driverService = new DriverService();
    });

    describe('createDriver', () => {
        it('should create a new driver and return the driver object', async () => {
            const newDriver: Driver = {
                driverId: '123-45-6789',
                firstName: 'John',
                lastName: 'Doe',
                address: {
                    street: '123 Main St',
                    city: 'Anytown',
                    state: 'CA',
                    zipCode: '12345'
                },
                phoneNumber: '555-1234',
                email: 'john.doe@example.com',
                carDetails: {
                    make: 'Toyota',
                    model: 'Camry',
                    year: 2020,
                    color: 'Blue',
                    licensePlate: 'ABC123'
                },
                rating: 4.5,
                reviews: [],
                introduction: {
                    imageUrl: 'http://example.com/image.jpg',
                    videoUrl: 'http://example.com/video.mp4'
                },
                ridesHistory: [],
                currentLocation: {
                    latitude: 34.0522,
                    longitude: -118.2437,
                    timestamp: new Date().toISOString()
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const createdDriver = await driverService.createDriver(newDriver);
            expect(createdDriver).toEqual(expect.objectContaining({
                driverId: newDriver.driverId,
                firstName: newDriver.firstName,
                lastName: newDriver.lastName,
            }));
        });
    });

    describe('getDriverById', () => {
        it('should return a driver object for a valid driverId', async () => {
            const driverId = '123-45-6789';
            const driver = await driverService.getDriverById(driverId);
            expect(driver).toBeDefined();
            expect(driver.driverId).toBe(driverId);
        });

        it('should throw an error for an invalid driverId', async () => {
            const invalidDriverId = 'invalid-id';
            await expect(driverService.getDriverById(invalidDriverId)).rejects.toThrow('Driver not found');
        });
    });

    // Additional tests for updateDriver, deleteDriver, etc. can be added here
});