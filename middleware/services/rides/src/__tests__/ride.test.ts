import request from 'supertest';
import app from '../app';
import { DatabaseService } from '../services/database.service';
import { RedisService } from '../services/redis.service';
import { KafkaService } from '../services/kafka.service';

// Mock services
jest.mock('../services/database.service');
jest.mock('../services/redis.service');
jest.mock('../services/kafka.service');

describe('Ride API Endpoints', () => {
  let mockToken: string;

  beforeAll(async () => {
    // Initialize mock services
    const dbService = DatabaseService.getInstance();
    const redisService = RedisService.getInstance();
    const kafkaService = KafkaService.getInstance();

    // Mock successful connections
    await Promise.all([
      dbService.connect(),
      redisService.connect(),
      kafkaService.connect()
    ]);

    // Generate a mock JWT token (you should replace this with your actual token generation logic)
    mockToken = 'mock.jwt.token';
  });

  afterAll(async () => {
    const dbService = DatabaseService.getInstance();
    const redisService = RedisService.getInstance();
    const kafkaService = KafkaService.getInstance();

    await Promise.all([
      dbService.disconnect(),
      redisService.disconnect(),
      kafkaService.disconnect()
    ]);
  });

  describe('POST /api/rides', () => {
    it('should create a new ride', async () => {
      const rideData = {
        pickupLocation: { latitude: 40.7128, longitude: -74.0060 },
        dropoffLocation: { latitude: 40.7580, longitude: -73.9855 },
        customerId: 'customer123'
      };

      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(rideData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.pickupLocation).toEqual(rideData.pickupLocation);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/rides')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/rides/:id', () => {
    it('should get a ride by id', async () => {
      const rideId = 'ride123';
      
      const response = await request(app)
        .get(`/api/rides/${rideId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', rideId);
    });

    it('should return 404 for non-existent ride', async () => {
      const response = await request(app)
        .get('/api/rides/nonexistent')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/rides/:id/status', () => {
    it('should update ride status', async () => {
      const rideId = 'ride123';
      const statusData = { status: 'ACCEPTED' };

      const response = await request(app)
        .put(`/api/rides/${rideId}/status`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(statusData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(statusData.status);
    });
  });
}); 