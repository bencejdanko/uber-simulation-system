import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { IRide } from '../models/ride.model';
import { IUser } from '../models/user.model';

export class WebSocketService {
  private static instance: WebSocketService;
  private io: Server;
  private driverConnections: Map<string, string>; // driverId -> socketId
  private customerConnections: Map<string, string>; // customerId -> socketId

  private constructor() {
    this.io = new Server();
    this.driverConnections = new Map();
    this.customerConnections = new Map();
    this.setupEventHandlers();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public initialize(server: any): void {
    this.io.attach(server);
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Handle driver connection
      socket.on('driver:connect', (driverId: string) => {
        this.driverConnections.set(driverId, socket.id);
        console.log(`Driver ${driverId} connected with socket ${socket.id}`);
      });

      // Handle customer connection
      socket.on('customer:connect', (customerId: string) => {
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
  public notifyNewRideRequest(ride: IRide, driverId: string): void {
    this.io.to(`driver:${driverId}`).emit('ride:requested', ride);
  }

  // Notify customer about ride status update
  public notifyRideStatusUpdate(ride: IRide) {
    const socketId = this.customerConnections.get(ride.customerId);
    if (socketId) {
      this.io.to(socketId).emit('ride:status-update', ride);
    }
  }

  // Notify driver about ride cancellation
  public notifyRideCancellation(ride: IRide, userId: string): void {
    this.io.to(`user:${userId}`).emit('ride:cancelled', ride);
  }

  // Notify customer about driver location update
  public notifyDriverLocationUpdate(ride: IRide, driverLocation: { latitude: number; longitude: number }) {
    const socketId = this.customerConnections.get(ride.customerId);
    if (socketId) {
      this.io.to(socketId).emit('driver:location-update', {
        rideId: ride._id,
        location: driverLocation
      });
    }
  }

  public notifyRideAccepted(ride: IRide, customerId: string): void {
    this.io.to(`user:${customerId}`).emit('ride:accepted', ride);
  }

  public notifyRideCompleted(ride: IRide, customerId: string): void {
    this.io.to(`user:${customerId}`).emit('ride:completed', ride);
  }
} 