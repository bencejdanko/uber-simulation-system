import request from 'supertest';
import app from '../../src/app'; // Adjust the path as necessary to import the app

describe('Driver Service Integration Tests', () => {
  let driverId;

  // Test data for creating a driver
  const newDriver = {
    driverId: '123-45-6789',
    firstName: 'John',
    lastName: 'Doe',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345'
    },
    phoneNumber: '123-456-7890',
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

  it('should create a new driver', async () => {
    const response = await request(app)
      .post('/drivers')
      .send(newDriver)
      .set('Authorization', 'Bearer your_token_here'); // Replace with a valid token

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('driverId', newDriver.driverId);
    driverId = response.body.driverId; // Store the driverId for later tests
  });

  it('should retrieve the created driver by ID', async () => {
    const response = await request(app)
      .get(`/drivers/${driverId}`)
      .set('Authorization', 'Bearer your_token_here'); // Replace with a valid token

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('driverId', driverId);
  });

  it('should update the driver information', async () => {
    const updatedData = {
      firstName: 'Jane',
      lastName: 'Doe'
    };

    const response = await request(app)
      .patch(`/drivers/${driverId}`)
      .send(updatedData)
      .set('Authorization', 'Bearer your_token_here'); // Replace with a valid token

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('firstName', updatedData.firstName);
  });

  it('should delete the driver', async () => {
    const response = await request(app)
      .delete(`/drivers/${driverId}`)
      .set('Authorization', 'Bearer your_token_here'); // Replace with a valid token

    expect(response.status).toBe(204);
  });

  it('should return 404 for deleted driver', async () => {
    const response = await request(app)
      .get(`/drivers/${driverId}`)
      .set('Authorization', 'Bearer your_token_here'); // Replace with a valid token

    expect(response.status).toBe(404);
  });
});