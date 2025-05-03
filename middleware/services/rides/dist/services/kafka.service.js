"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaService = void 0;
const kafkajs_1 = require("kafkajs");
const config_1 = require("../config");
class KafkaService {
    constructor() {
        this.isConnected = false;
        this.kafka = new kafkajs_1.Kafka({
            clientId: 'rides-service',
            brokers: config_1.config.kafka.brokers,
            ssl: process.env.KAFKA_SSL === 'true',
            sasl: process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD ? {
                mechanism: 'plain',
                username: process.env.KAFKA_USERNAME,
                password: process.env.KAFKA_PASSWORD
            } : undefined
        });
        this.producer = this.kafka.producer();
    }
    static getInstance() {
        if (!KafkaService.instance) {
            KafkaService.instance = new KafkaService();
        }
        return KafkaService.instance;
    }
    async connect() {
        if (this.isConnected) {
            return;
        }
        try {
            await this.producer.connect();
            this.isConnected = true;
            console.log('Connected to Kafka');
        }
        catch (error) {
            console.error('Failed to connect to Kafka:', error);
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await this.producer.disconnect();
            this.isConnected = false;
            console.log('Disconnected from Kafka');
        }
        catch (error) {
            console.error('Error disconnecting from Kafka:', error);
            throw error;
        }
    }
    async publishRideRequested(ride) {
        if (!this.isConnected) {
            throw new Error('Kafka producer not connected');
        }
        try {
            await this.producer.send({
                topic: 'ride.requested',
                messages: [{
                        key: ride._id.toString(),
                        value: JSON.stringify({
                            eventType: 'RIDE_REQUESTED',
                            rideId: ride._id,
                            customerId: ride.customerId,
                            pickupLocation: ride.pickupLocation,
                            dropoffLocation: ride.dropoffLocation,
                            requestTimestamp: ride.createdAt,
                            status: ride.status
                        })
                    }]
            });
        }
        catch (error) {
            console.error('Failed to publish ride requested event:', error);
            throw error;
        }
    }
    async publishRideCancelled(ride, reason) {
        if (!this.isConnected) {
            throw new Error('Kafka producer not connected');
        }
        try {
            await this.producer.send({
                topic: 'ride.cancelled',
                messages: [{
                        key: ride._id.toString(),
                        value: JSON.stringify({
                            eventType: 'RIDE_CANCELLED',
                            rideId: ride._id,
                            customerId: ride.customerId,
                            driverId: ride.driverId,
                            cancelledBy: ride.customerId === ride.customerId ? 'CUSTOMER' : 'DRIVER',
                            timestamp: new Date().toISOString(),
                            previousStatus: ride.status,
                            reason: reason
                        })
                    }]
            });
        }
        catch (error) {
            console.error('Failed to publish ride cancelled event:', error);
            throw error;
        }
    }
    async publishRideStatusUpdated(ride, previousStatus) {
        if (!this.isConnected) {
            throw new Error('Kafka producer not connected');
        }
        try {
            await this.producer.send({
                topic: 'ride.status.updated',
                messages: [{
                        key: ride._id.toString(),
                        value: JSON.stringify({
                            eventType: 'RIDE_STATUS_UPDATED',
                            rideId: ride._id,
                            customerId: ride.customerId,
                            driverId: ride.driverId,
                            previousStatus,
                            newStatus: ride.status,
                            timestamp: new Date().toISOString()
                        })
                    }]
            });
        }
        catch (error) {
            console.error('Failed to publish ride status updated event:', error);
            throw error;
        }
    }
    async publishDriverLocationUpdated(driverId, location) {
        if (!this.isConnected) {
            throw new Error('Kafka producer not connected');
        }
        try {
            await this.producer.send({
                topic: 'driver.location.updated',
                messages: [{
                        key: driverId,
                        value: JSON.stringify({
                            eventType: 'DRIVER_LOCATION_UPDATED',
                            driverId,
                            location,
                            timestamp: new Date().toISOString()
                        })
                    }]
            });
        }
        catch (error) {
            console.error('Failed to publish driver location updated event:', error);
            throw error;
        }
    }
    async publishDriverAssigned(ride) {
        if (!this.isConnected) {
            throw new Error('Kafka producer not connected');
        }
        try {
            await this.producer.send({
                topic: 'ride.driver.assigned',
                messages: [{
                        key: ride._id.toString(),
                        value: JSON.stringify({
                            eventType: 'DRIVER_ASSIGNED',
                            rideId: ride._id,
                            customerId: ride.customerId,
                            driverId: ride.driverId,
                            timestamp: new Date().toISOString()
                        })
                    }]
            });
        }
        catch (error) {
            console.error('Failed to publish driver assigned event:', error);
            throw error;
        }
    }
    async publishRideCompleted(ride) {
        if (!this.isConnected) {
            throw new Error('Kafka producer not connected');
        }
        try {
            await this.producer.send({
                topic: 'ride.completed',
                messages: [{
                        key: ride._id.toString(),
                        value: JSON.stringify({
                            eventType: 'RIDE_COMPLETED',
                            rideId: ride._id,
                            customerId: ride.customerId,
                            driverId: ride.driverId,
                            timestamp: new Date().toISOString()
                        })
                    }]
            });
        }
        catch (error) {
            console.error('Failed to publish ride completed event:', error);
            throw error;
        }
    }
}
exports.KafkaService = KafkaService;
