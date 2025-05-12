# Admin Dashboard API Design

## Overview Statistics Endpoints

### GET /api/v1/admin/statistics/overview
Returns key statistics for the admin dashboard.

**Response:**
```json
{
  "totalRides": 4827,
  "totalDrivers": 321,
  "totalCustomers": 1253,
  "totalRevenue": 78659.45,
  "activeDrivers": 298,
  "activeCustomers": 876
}
```

### GET /api/v1/admin/charts/rides-by-city
Returns ride distribution by city data.

**Query Parameters:**
- timeRange: "daily" | "weekly" | "monthly"

**Response:**
```json
[
  { "city": "New York", "value": 1245 },
  { "city": "Los Angeles", "value": 862 },
  { "city": "Chicago", "value": 573 },
  { "city": "Houston", "value": 421 },
  { "city": "Phoenix", "value": 312 },
  { "city": "Philadelphia", "value": 245 }
]
```

### GET /api/v1/admin/charts/rides-by-hour
Returns ride distribution by hour data.

**Query Parameters:**
- timeRange: "daily" | "weekly" | "monthly"

**Response:**
```json
[
  { "hour": 0, "rides": 15 },
  { "hour": 1, "rides": 10 },
  // ... 24 hour data points
]
```

### GET /api/v1/admin/charts/revenue-by-day
Returns revenue distribution by day data.

**Query Parameters:**
- timeRange: "weekly" | "monthly" | "yearly"

**Response:**
```json
[
  { "day": "Mon", "revenue": 4250 },
  { "day": "Tue", "revenue": 3980 },
  { "day": "Wed", "revenue": 4120 },
  { "day": "Thu", "revenue": 4320 },
  { "day": "Fri", "revenue": 5780 },
  { "day": "Sat", "revenue": 6250 },
  { "day": "Sun", "revenue": 5120 }
]
```

## Driver Management Endpoints

### GET /api/v1/admin/drivers
Returns a list of drivers.

**Query Parameters:**
- page: number
- limit: number
- search: string (optional)
- status: "active" | "inactive" (optional)

**Response:**
```json
{
  "total": 321,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": "123-45-6789",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "carDetails": {
        "make": "Toyota",
        "model": "Camry",
        "year": 2020,
        "color": "Silver",
        "licensePlate": "ABC123"
      },
      "rating": 4.8,
      "status": "active",
      "ridesCount": 352,
      "totalEarnings": 14280.50
    }
    // more drivers...
  ]
}
```

### GET /api/v1/admin/drivers/:id
Returns details for a specific driver.

**Response:**
```json
{
  "id": "123-45-6789",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "carDetails": {
    "make": "Toyota",
    "model": "Camry",
    "year": 2020,
    "color": "Silver",
    "licensePlate": "ABC123"
  },
  "rating": 4.8,
  "status": "active",
  "ridesCount": 352,
  "totalEarnings": 14280.50,
  "reviews": [
    {
      "id": "R123456",
      "customerId": "321-54-9876",
      "customerName": "Alice Smith",
      "rating": 5,
      "comment": "Very professional driver, car was clean and ride was smooth",
      "date": "2023-04-15T14:23:00Z"
    }
    // more reviews...
  ],
  "rides": [
    {
      "id": "RIDE123456",
      "date": "2023-04-18T09:30:00Z",
      "pickup": "123 Main St, NY",
      "dropoff": "456 Park Ave, NY",
      "distance": 5.7,
      "amount": 22.50,
      "status": "completed"
    }
    // more rides...
  ]
}
```

### POST /api/v1/admin/drivers
Creates a new driver.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "phone": "+1987654321",
  "address": "456 Oak St",
  "city": "Los Angeles",
  "state": "CA",
  "zipCode": "90001",
  "ssn": "987-65-4321",
  "carDetails": {
    "make": "Honda",
    "model": "Accord",
    "year": 2019,
    "color": "Black",
    "licensePlate": "XYZ789"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Driver created successfully",
  "data": {
    "id": "987-65-4321"
  }
}
```

### PUT /api/v1/admin/drivers/:id
Updates a driver.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith-Johnson",
  "email": "jane.smith@example.com",
  "phone": "+1987654321",
  "address": "789 Pine St",
  "city": "Los Angeles",
  "state": "CA",
  "zipCode": "90002",
  "carDetails": {
    "make": "Honda",
    "model": "Accord",
    "year": 2019,
    "color": "Blue",
    "licensePlate": "XYZ789"
  },
  "status": "inactive"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Driver updated successfully"
}
```

### DELETE /api/v1/admin/drivers/:id
Deletes a driver.

**Response:**
```json
{
  "success": true,
  "message": "Driver deleted successfully"
}
```

## Customer Management Endpoints

### GET /api/v1/admin/customers
Returns a list of customers.

**Query Parameters:**
- page: number
- limit: number
- search: string (optional)
- status: "active" | "inactive" (optional)

**Response:**
```json
{
  "total": 1253,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": "321-54-9876",
      "firstName": "Alice",
      "lastName": "Smith",
      "email": "alice.smith@example.com",
      "phone": "+1122334455",
      "address": "789 Pine St",
      "city": "Chicago",
      "state": "IL",
      "zipCode": "60601",
      "status": "active",
      "ridesCount": 45,
      "totalSpent": 1245.60
    }
    // more customers...
  ]
}
```

## Billing Management Endpoints

### GET /api/v1/admin/bills
Returns a list of bills.

**Query Parameters:**
- page: number
- limit: number
- search: string (optional)
- startDate: string (optional, ISO format)
- endDate: string (optional, ISO format)

**Response:**
```json
{
  "total": 9872,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": "B123456",
      "date": "2023-05-10",
      "amount": 35.75,
      "customer": "John Doe",
      "customerId": "123-45-6789",
      "driver": "Mark Wilson",
      "driverId": "987-65-4321",
      "source": "Downtown",
      "destination": "Airport",
      "distance": 12.5,
      "pickupTime": "2023-05-10T14:30:00Z",
      "dropoffTime": "2023-05-10T15:05:00Z"
    }
    // more bills...
  ]
}
```

## Rides Analysis Endpoints

### GET /api/v1/admin/rides/distribution
Returns ride distribution data for maps.

**Query Parameters:**
- timeRange: "daily" | "weekly" | "monthly"
- city: string (optional)

**Response:**
```json
{
  "geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "count": 245,
          "intensity": 0.8
        },
        "geometry": {
          "type": "Point",
          "coordinates": [-73.9857, 40.7484]
        }
      }
      // more geojson points...
    ]
  }
}
```

### GET /api/v1/admin/rides/peak-times
Returns peak time analysis data.

**Response:**
```json
{
  "weekdayPeaks": [
    { "day": "Monday", "hour": 8, "count": 342 },
    { "day": "Monday", "hour": 17, "count": 456 }
    // more data points...
  ],
  "weekendPeaks": [
    { "day": "Saturday", "hour": 21, "count": 578 },
    { "day": "Saturday", "hour": 22, "count": 623 }
    // more data points...
  ]
}
``` 