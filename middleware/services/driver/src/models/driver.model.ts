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

export interface Introduction {
  imageUrl?: string; // URL
  videoUrl?: string; // URL
}

export interface CurrentLocation {
  latitude?: number;
  longitude?: number;
  timestamp?: string; // ISO 8601 Format
}

export interface RideHistory {
  rideId: string;
  date: string;
  fare: number;
}

export interface Driver {
  driverId: string; // SSN Format: xxx-xx-xxxx
  firstName: string;
  lastName: string;
  address: Address;
  phoneNumber: string;
  email: string; // email format
  carDetails: CarDetails;
  rating?: number; // float, 1.0-5.0
  reviews?: Review[];
  introduction?: Introduction;
  ridesHistory?: RideHistory[];
  currentLocation?: CurrentLocation;
  createdAt: string; // ISO 8601 Format
  updatedAt: string; // ISO 8601 Format
}