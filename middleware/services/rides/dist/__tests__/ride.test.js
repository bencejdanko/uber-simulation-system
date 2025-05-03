"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const database_service_1 = require("../services/database.service");
const redis_service_1 = require("../services/redis.service");
const kafka_service_1 = require("../services/kafka.service");
// Mock services
jest.mock('../services/database.service');
jest.mock('../services/redis.service');
jest.mock('../services/kafka.service');
describe('Ride API Endpoints', () => {
    let mockToken;
    beforeAll(async () => {
        // Initialize mock services
        const dbService = database_service_1.DatabaseService.getInstance();
        const redisService = redis_service_1.RedisService.getInstance();
        const kafkaService = kafka_service_1.KafkaService.getInstance();
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
        const dbService = database_service_1.DatabaseService.getInstance();
        const redisService = redis_service_1.RedisService.getInstance();
        const kafkaService = kafka_service_1.KafkaService.getInstance();
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
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/rides')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(rideData);
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.pickupLocation).toEqual(rideData.pickupLocation);
        });
        it('should return 401 without authentication', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/rides')
                .send({});
            expect(response.status).toBe(401);
        });
    });
    describe('GET /api/rides/:id', () => {
        it('should get a ride by id', async () => {
            const rideId = 'ride123';
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/rides/${rideId}`)
                .set('Authorization', `Bearer ${mockToken}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id', rideId);
        });
        it('should return 404 for non-existent ride', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/rides/nonexistent')
                .set('Authorization', `Bearer ${mockToken}`);
            expect(response.status).toBe(404);
        });
    });
    describe('PUT /api/rides/:id/status', () => {
        it('should update ride status', async () => {
            const rideId = 'ride123';
            const statusData = { status: 'ACCEPTED' };
            const response = await (0, supertest_1.default)(app_1.default)
                .put(`/api/rides/${rideId}/status`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send(statusData);
            expect(response.status).toBe(200);
            expect(response.body.status).toBe(statusData.status);
        });
    });
});
