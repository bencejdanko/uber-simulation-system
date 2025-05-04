// Common interfaces
export interface BasePayload {
  timestamp: number;
  correlationId: string;
}

// Signup-related interfaces
export interface SignupRequestPayload extends BasePayload {
  role: 'driver' | 'customer'; // Determines which type of account to create
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password: string; // In a real system, this would be handled more securely
}

// Driver location-related interfaces
export interface LocationUpdatePayload extends BasePayload {
  driverId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  status: 'available' | 'busy' | 'offline';
}

// Ride-related interfaces
export interface RideRequestPayload extends BasePayload {
  customerId: string;
  pickup: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  requestedVehicleType?: string;
  estimatedPrice?: number;
}

export interface RideCompletedPayload extends BasePayload {
  rideId: string;
  customerId: string;
  driverId: string;
  startTime: number;
  endTime: number;
  distance: number; // in kilometers
  duration: number; // in seconds
  fare: {
    baseAmount: number;
    distanceAmount: number;
    timeAmount: number;
    totalAmount: number;
    currency: string;
  };
}