# API Gateway Service

This service acts as the entry point for the Uber simulation system, providing REST APIs for client applications and forwarding requests to the appropriate microservices through Kafka.

## Available Endpoints

### Health Check
- `GET /health`
  - Status check for the API Gateway

### User/Driver Signup
- `POST /api/v1/signup`
  - Body:
    ```json
    {
      "role": "customer", // or "driver"
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "password": "securepassword" // Would be hashed in production
    }
    ```

### Driver Location Updates
- `POST /api/v1/drivers/:id/location`
  - Body:
    ```json
    {
      "latitude": 37.7749,
      "longitude": -122.4194
    }
    ```

### Ride Requests
- `POST /api/v1/rides`
  - Body:
    ```json
    {
      "customerId": "customer-123",
      "pickupLocation": {
        "latitude": 37.7749,
        "longitude": -122.4194
      },
      "dropoffLocation": {
        "latitude": 37.7833,
        "longitude": -122.4167
      },
      "paymentMethod": "CARD" // or "CASH"
    }
    ```

### Ride Completion
- `POST /api/v1/rides/:id/complete`
  - Body:
    ```json
    {
      "driverId": "driver-456",
      "actualDropoffLocation": {
        "latitude": 37.7833,
        "longitude": -122.4167
      },
      "fareAmount": 15.75,
      "paymentStatus": "COMPLETED"
    }
    ```

## Running for Smoke Test

For smoke test purposes, the API Gateway is configured to return successful responses even if the backend services are not running. This allows for basic API testing without the full infrastructure.

To run the API Gateway:

1. Install dependencies:
   ```
   npm install
   ```

2. Run in development mode:
   ```
   npm run dev
   ```

3. Test the endpoints using curl or a tool like Postman

Example curl commands:

```bash
# Health check
curl http://localhost:3000/health

# Signup
curl -X POST http://localhost:3000/api/v1/signup \
  -H "Content-Type: application/json" \
  -d '{"role": "customer", "name": "John Doe", "email": "john@example.com"}'

# Driver location update
curl -X POST http://localhost:3000/api/v1/drivers/driver-123/location \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7749, "longitude": -122.4194}'

# Request ride
curl -X POST http://localhost:3000/api/v1/rides \
  -H "Content-Type: application/json" \
  -d '{"customerId": "customer-123", "pickupLocation": {"latitude": 37.7749, "longitude": -122.4194}, "dropoffLocation": {"latitude": 37.7833, "longitude": -122.4167}}'

# Complete ride
curl -X POST http://localhost:3000/api/v1/rides/ride-123/complete \
  -H "Content-Type: application/json" \
  -d '{"driverId": "driver-456", "fareAmount": 15.75}'
```