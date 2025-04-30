# Uber Rides Service

This service handles ride management in the Uber simulation system, including ride requests, matching, and status updates.

## Features

- Ride request creation and management
- Driver matching and assignment
- Real-time ride status updates
- Ride cancellation
- Nearby driver search
- Ride history and details

## Prerequisites

- Node.js 18+
- MongoDB
- Kafka
- Docker (optional)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.template` to `.env` and configure environment variables
4. Start MongoDB and Kafka services

## Development

```bash
# Start in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## API Endpoints

- `POST /rides` - Create a new ride request
- `GET /rides/{ride_id}` - Get ride details
- `GET /rides` - List rides (with filters)
- `DELETE /rides/{ride_id}` - Cancel a ride
- `GET /drivers/nearby` - Find nearby drivers

## Docker

```bash
# Build the image
docker build -t uber-rides-service .

# Run the container
docker run -p 3004:3004 uber-rides-service
```

## Environment Variables

- `PORT` - Service port (default: 3004)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret for authentication
- `KAFKA_BROKERS` - Kafka broker addresses
- `KAFKA_CLIENT_ID` - Kafka client ID
- `LOG_LEVEL` - Logging level
- `NODE_ENV` - Environment (development/production) 