export interface Ride {
  id: string;
  customerId: string;
  driverId?: string;
  pickupLocation: {
    latitude: number;
    longitude: number;
  };
  dropoffLocation: {
    latitude: number;
    longitude: number;
  };
  status: 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  fare: number;
  createdAt: Date;
  updatedAt: Date;
} 