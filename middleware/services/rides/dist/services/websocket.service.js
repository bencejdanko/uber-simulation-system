"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const socket_io_1 = require("socket.io");
class WebSocketService {
    constructor() {
        this.io = new socket_io_1.Server();
        this.driverConnections = new Map();
        this.customerConnections = new Map();
        this.setupEventHandlers();
    }
    static getInstance() {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }
    initialize(server) {
        this.io.attach(server);
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log('New client connected:', socket.id);
            // Handle driver connection
            socket.on('driver:connect', (driverId) => {
                this.driverConnections.set(driverId, socket.id);
                console.log(`Driver ${driverId} connected with socket ${socket.id}`);
            });
            // Handle customer connection
            socket.on('customer:connect', (customerId) => {
                this.customerConnections.set(customerId, socket.id);
                console.log(`Customer ${customerId} connected with socket ${socket.id}`);
            });
            // Handle disconnection
            socket.on('disconnect', () => {
                // Remove driver connection
                for (const [driverId, socketId] of this.driverConnections.entries()) {
                    if (socketId === socket.id) {
                        this.driverConnections.delete(driverId);
                        console.log(`Driver ${driverId} disconnected`);
                        break;
                    }
                }
                // Remove customer connection
                for (const [customerId, socketId] of this.customerConnections.entries()) {
                    if (socketId === socket.id) {
                        this.customerConnections.delete(customerId);
                        console.log(`Customer ${customerId} disconnected`);
                        break;
                    }
                }
            });
        });
    }
    // Notify driver about new ride request
    notifyNewRideRequest(ride, driverId) {
        this.io.to(`driver:${driverId}`).emit('ride:requested', ride);
    }
    // Notify customer about ride status update
    notifyRideStatusUpdate(ride) {
        const socketId = this.customerConnections.get(ride.customerId);
        if (socketId) {
            this.io.to(socketId).emit('ride:status-update', ride);
        }
    }
    // Notify driver about ride cancellation
    notifyRideCancellation(ride, userId) {
        this.io.to(`user:${userId}`).emit('ride:cancelled', ride);
    }
    // Notify customer about driver location update
    notifyDriverLocationUpdate(ride, driverLocation) {
        const socketId = this.customerConnections.get(ride.customerId);
        if (socketId) {
            this.io.to(socketId).emit('driver:location-update', {
                rideId: ride._id,
                location: driverLocation
            });
        }
    }
    notifyRideAccepted(ride, customerId) {
        this.io.to(`user:${customerId}`).emit('ride:accepted', ride);
    }
    notifyRideCompleted(ride, customerId) {
        this.io.to(`user:${customerId}`).emit('ride:completed', ride);
    }
}
exports.WebSocketService = WebSocketService;
