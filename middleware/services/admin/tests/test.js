const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../src/app'); // Adjust path if needed
const { disconnectProducer } = require('../src/kafka/producer');
const redis = require('../src/utils/cache'); 

process.env.JWT_SECRET = 'secret';

let mongoServer;
let token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  
  // Create a JWT token for authentication
  token = jwt.sign({ adminId: '123-45-6789', role: 'ADMIN' }, process.env.JWT_SECRET || 'secret');
});

// Ensures MongoDB memory server is stopped and cleaned up
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  await disconnectProducer();
  await redis.quit();
});

// Increase timeout if tests are running long due to MongoDB setup
jest.setTimeout(10000);  // 10 seconds

describe('Admin /drivers API', () => {
  const driverPayload = {
    driverId: '123-45-6789',
    firstName: 'John',
    lastName: 'Doe',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    },
    phoneNumber: '1234567890',
    email: 'john.doe@example.com',
    carDetails: {
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      color: 'Blue',
      licensePlate: 'ABC123'
    }
  };

  it('Admin - should create a driver (POST /drivers)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/drivers')
      .set('Authorization', `Bearer ${token}`)
      .send(driverPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('driverId', '123-45-6789');
  });

  it('Admin - should retrieve a driver (GET /drivers/:driver_id)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/drivers/123-45-6789')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', 'john.doe@example.com');
  });
});

describe('Admin /customers API', () => {
  const customerPayload = {
    customerId: '123-45-6789',
    firstName: 'Jane',
    lastName: 'Doe',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'NY',
      zipCode: '10001'
    },
    phoneNumber: '9876543210',
    email: 'jane.doe@example.com',
    creditCardDetails: {
      last4Digits: '1234',
      cardType: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025
    }
  };

  it('should create a customer (POST /customers)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/customers')
      .set('Authorization', `Bearer ${token}`)
      .send(customerPayload);
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('customerId');
    expect(res.body.firstName).toBe('Jane');
    expect(res.body.lastName).toBe('Doe');
  });

  it('should retrieve a customer (GET /customers/:customer_id)', async () => {
    const customerId = '123-45-6789';
    const res = await request(app)
      .get(`/api/v1/admin/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('customerId', customerId);
    expect(res.body.firstName).toBe('Jane');
    expect(res.body.lastName).toBe('Doe');
  });
});

describe('Admin /bills API', () => {
  const billPayload = {
    billingId: '123-45-6789',
    rideId: '999-99-9999',
    customerId: '123-45-6789',
    driverId: '123-45-6789',
    date: '2025-05-05',
    pickupTime: '2025-05-05T08:00:00Z',
    dropoffTime: '2025-05-05T08:30:00Z',
    distanceCovered: 10.5,
    sourceLocation: {
      latitude: 40.7128,
      longitude: -74.0060,
      addressLine: '123 Main St, New York, NY'
    },
    destinationLocation: {
      latitude: 40.7306,
      longitude: -73.9352,
      addressLine: '456 Broadway, New York, NY'
    },
    predictedAmount: 25.00,
    actualAmount: 27.50,
    paymentStatus: 'PAID',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeAll(async () => {
    const Billing = require('../src/models/billing.model'); // Adjust path if necessary
    await Billing.create(billPayload);
  });

  it('should get all bills (GET /bills)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/bills')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should retrieve a bill by ID (GET /bills/:billing_id)', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/bills/${billPayload.billingId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('billingId', billPayload.billingId);
    expect(res.body).toHaveProperty('actualAmount', billPayload.actualAmount);
  });
});

describe('Admin /statistics API', () => {
  let token;

  beforeAll(async () => {
    token = jwt.sign({ adminId: '123-45-6789', role: 'ADMIN' }, process.env.JWT_SECRET || 'secret');
  });

  it('should get statistics (GET /statistics)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/statistics?start_date=2025-01-01&end_date=2025-05-01')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('rides');
    expect(res.body.data).toHaveProperty('billing');
  });

  it('should return 400 if missing start_date or end_date', async () => {
    const res = await request(app)
      .get('/api/v1/admin/statistics')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'start_date and end_date are required');
  });
});

describe('Admin /charts API', () => {
  it('should get chart data (GET /charts)', async () => {
    // Valid query parameters: chart_type, start_date, end_date
    const res = await request(app)
      .get('/api/v1/admin/charts?chart_type=ride_volume&start_date=2025-01-01&end_date=2025-05-01')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data'); // Assuming the response contains chart data
    expect(res.body).toHaveProperty('chartType', 'ride_volume'); // Assuming the chart type is included in the response
  });

  it('should return 400 if missing chart_type parameter', async () => {
    // Missing chart_type
    const res = await request(app)
      .get('/api/v1/admin/charts?start_date=2025-01-01&end_date=2025-05-01')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'chart_type is required');
  });

  it('should return 400 if missing start_date or end_date', async () => {
    // Missing start_date and end_date
    const res = await request(app)
      .get('/api/v1/admin/charts?chart_type=ride_volume')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'start_date and end_date are required');
  });

  it('should cache chart data and return cached response', async () => {
    // First request, should return new data
    const firstRes = await request(app)
      .get('/api/v1/admin/charts?chart_type=ride_volume&start_date=2025-01-01&end_date=2025-05-01')
      .set('Authorization', `Bearer ${token}`);

    expect(firstRes.statusCode).toBe(200);

    // Second request, should return cached data
    const secondRes = await request(app)
      .get('/api/v1/admin/charts?chart_type=ride_volume&start_date=2025-01-01&end_date=2025-05-01')
      .set('Authorization', `Bearer ${token}`);
    
    expect(secondRes.statusCode).toBe(200);
    expect(secondRes.body).toEqual(firstRes.body); // Should match the first response if cached correctly
  });
});
