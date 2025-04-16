export interface Address {
  street: string;
  city: string;
  state: string; // Valid US State Abbreviation or Full Name
  zipCode: string; // Format: xxxxx or xxxxx-xxxx
}

export interface CarDetails {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
}

export interface Review {
  reviewId: string;
  customerId: string; // SSN Format
  rating: number; // 1-5
  comment: string;
  timestamp: string; // ISO 8601 Format
}

export interface CurrentLocation {
  latitude: number;
  longitude: number;
  timestamp: string; // ISO 8601 Format
}

export interface Driver {
  driverId: string; // SSN Format: xxx-xx-xxxx
  firstName: string;
  lastName: string;
  address: Address;
  phoneNumber: string;
  email: string; // email format
  carDetails: CarDetails;
  rating: number; // float, 1.0-5.0
  reviews?: Review[];
  introduction?: {
    imageUrl?: string; // URL
    videoUrl?: string; // URL
  };
  ridesHistory?: { rideId: string; date: string; fare: number }[];
  currentLocation?: CurrentLocation;
  createdAt: string; // ISO 8601 Format
  updatedAt: string; // ISO 8601 Format
}

export interface DriverInput {
  driverId: string; // Required, SSN Format
  firstName: string; // Required
  lastName: string; // Required
  address: Address; // Required
  phoneNumber: string; // Required
  email: string; // Required, email format
  carDetails: CarDetails; // Required
  introduction?: {
    imageUrl?: string; // URL
    videoUrl?: string; // URL
  };
}

export interface DriverUpdate {
  firstName?: string; // Optional
  lastName?: string; // Optional
  address?: Partial<Address>; // Optional
  phoneNumber?: string; // Optional
  email?: string; // Optional, email format
  carDetails?: Partial<CarDetails>; // Optional
  introduction?: {
    imageUrl?: string; // URL
    videoUrl?: string; // URL
  };
  rating?: number; // Optional
  reviews?: Review[]; // Optional
}

export interface DriverLocationUpdate {
  latitude: number; // Required
  longitude: number; // Required
  timestamp: string; // Required, ISO 8601 Format
}