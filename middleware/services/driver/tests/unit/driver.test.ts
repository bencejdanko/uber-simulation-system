import DriverController from '../../src/controllers/driver.controller';
import { DriverService } from '../../src/services/driver.service';
import { Request, Response } from 'express';
import { Driver, DriverInput, DriverUpdate, DriverLocationUpdate } from '../../src/types/driver.types';

// Mock the DriverService
jest.mock('../../src/services/driver.service');

describe('DriverController', () => {
  let driverController: DriverController;
  let mockDriverService: jest.Mocked<DriverService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;
  let responseLocation: jest.Mock;
  let responseSend: jest.Mock;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock functions for response
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockReturnThis();
    responseLocation = jest.fn().mockReturnThis();
    responseSend = jest.fn().mockReturnThis();

    // Setup mock response
    mockResponse = {
      status: responseStatus,
      json: responseJson,
      location: responseLocation,
      send: responseSend
    };

    // Setup mock DriverService
    mockDriverService = new DriverService() as jest.Mocked<DriverService>;
    
    // Create DriverController with mocked service
    driverController = new DriverController(mockDriverService);
  });

  // Sample driver data for tests
  const sampleDriver: Driver = {
    _id: '123-45-6789', // Add _id property for MongoDB compatibility
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

  describe('createDriver', () => {
    it('should create a driver and return 201 status with the driver data', async () => {
      // Setup
      const driverInput: DriverInput = {
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
        introduction: {
          imageUrl: 'http://example.com/image.jpg',
          videoUrl: 'http://example.com/video.mp4'
        }
      };

      mockRequest = {
        body: driverInput
      };

      mockDriverService.createDriver = jest.fn().mockResolvedValue(sampleDriver);

      // Execute
      await driverController.createDriver(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockDriverService.createDriver).toHaveBeenCalledWith(driverInput);
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseLocation).toHaveBeenCalledWith(`/drivers/${sampleDriver._id}`);
      expect(responseJson).toHaveBeenCalledWith(sampleDriver);
    });

    it('should handle errors and return appropriate status code', async () => {
      // Setup
      mockRequest = {
        body: {}
      };

      const error = new Error('Validation error');
      (error as any).status = 400;
      (error as any).code = 'validation_error';

      mockDriverService.createDriver = jest.fn().mockRejectedValue(error);

      // Execute
      await driverController.createDriver(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'validation_error',
        message: 'Validation error'
      });
    });
  });

  describe('getDriverById', () => {
    it('should return a driver when a valid ID is provided', async () => {
      // Setup
      mockRequest = {
        params: {
          driver_id: '123-45-6789'
        }
      };

      mockDriverService.getDriverById = jest.fn().mockResolvedValue(sampleDriver);

      // Execute
      await driverController.getDriverById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockDriverService.getDriverById).toHaveBeenCalledWith('123-45-6789');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(sampleDriver);
    });

    it('should return 404 when driver is not found', async () => {
      // Setup
      mockRequest = {
        params: {
          driver_id: 'non-existent-id'
        }
      };

      const error = new Error('Driver not found');
      (error as any).status = 404;
      (error as any).code = 'not_found';

      mockDriverService.getDriverById = jest.fn().mockRejectedValue(error);

      // Execute
      await driverController.getDriverById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'not_found',
        message: 'Driver not found'
      });
    });
  });

  describe('updateDriver', () => {
    it('should update a driver and return the updated data', async () => {
      // Setup
      const updateData: DriverUpdate = {
        firstName: 'Jane',
        phoneNumber: '987-654-3210'
      };

      mockRequest = {
        params: {
          driver_id: '123-45-6789'
        },
        body: updateData
      };

      const updatedDriver = { ...sampleDriver, ...updateData };
      mockDriverService.updateDriver = jest.fn().mockResolvedValue(updatedDriver);

      // Execute
      await driverController.updateDriver(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockDriverService.updateDriver).toHaveBeenCalledWith('123-45-6789', updateData);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(updatedDriver);
    });

    it('should return 404 when trying to update a non-existent driver', async () => {
      // Setup
      mockRequest = {
        params: {
          driver_id: 'non-existent-id'
        },
        body: { firstName: 'Test' }
      };

      const error = new Error('Driver not found');
      (error as any).status = 404;
      (error as any).code = 'not_found';

      mockDriverService.updateDriver = jest.fn().mockRejectedValue(error);

      // Execute
      await driverController.updateDriver(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'not_found',
        message: 'Driver not found'
      });
    });
  });

  describe('deleteDriver', () => {
    it('should delete a driver and return 204 status', async () => {
      // Setup
      mockRequest = {
        params: {
          driver_id: '123-45-6789'
        }
      };

      mockDriverService.deleteDriver = jest.fn().mockResolvedValue(true);

      // Execute
      await driverController.deleteDriver(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockDriverService.deleteDriver).toHaveBeenCalledWith('123-45-6789');
      expect(responseStatus).toHaveBeenCalledWith(204);
      expect(responseSend).toHaveBeenCalled();
    });

    it('should return 404 when trying to delete a non-existent driver', async () => {
      // Setup
      mockRequest = {
        params: {
          driver_id: 'non-existent-id'
        }
      };

      const error = new Error('Driver not found');
      (error as any).status = 404;
      (error as any).code = 'not_found';

      mockDriverService.deleteDriver = jest.fn().mockRejectedValue(error);

      // Execute
      await driverController.deleteDriver(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'not_found',
        message: 'Driver not found'
      });
    });
  });

  describe('listDrivers', () => {
    it('should return a list of drivers', async () => {
      // Setup
      mockRequest = {
        query: {}
      };

      const driversList = [sampleDriver];
      mockDriverService.listDrivers = jest.fn().mockResolvedValue(driversList);

      // Execute
      await driverController.listDrivers(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockDriverService.listDrivers).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(driversList);
    });

    it('should handle errors when listing drivers', async () => {
      // Setup
      mockRequest = {
        query: {}
      };

      const error = new Error('Database error');
      (error as any).status = 500;
      (error as any).code = 'database_error';

      mockDriverService.listDrivers = jest.fn().mockRejectedValue(error);

      // Execute
      await driverController.listDrivers(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'database_error',
        message: 'Database error'
      });
    });
  });

  describe('updateDriverLocation', () => {
    it('should update driver location and return updated driver', async () => {
      // Setup
      const locationUpdate: DriverLocationUpdate = {
        latitude: 37.7749,
        longitude: -122.4194,
        timestamp: new Date().toISOString()
      };

      mockRequest = {
        params: {
          driver_id: '123-45-6789'
        },
        body: locationUpdate
      };

      const updatedDriver = { 
        ...sampleDriver, 
        currentLocation: locationUpdate,
        updatedAt: new Date().toISOString()
      };
      
      mockDriverService.updateDriverLocation = jest.fn().mockResolvedValue(updatedDriver);

      // Execute
      await driverController.updateDriverLocation(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockDriverService.updateDriverLocation).toHaveBeenCalledWith('123-45-6789', locationUpdate);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(updatedDriver);
    });

    it('should return 404 when trying to update location for non-existent driver', async () => {
      // Setup
      mockRequest = {
        params: {
          driver_id: 'non-existent-id'
        },
        body: {
          latitude: 37.7749,
          longitude: -122.4194,
          timestamp: new Date().toISOString()
        }
      };

      const error = new Error('Driver not found');
      (error as any).status = 404;
      (error as any).code = 'not_found';

      mockDriverService.updateDriverLocation = jest.fn().mockRejectedValue(error);

      // Execute
      await driverController.updateDriverLocation(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'not_found',
        message: 'Driver not found'
      });
    });
  });
});