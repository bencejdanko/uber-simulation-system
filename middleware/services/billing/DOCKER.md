# Docker Setup for Billing Service

This document provides instructions for building and running the Billing Service using Docker.

## Prerequisites

- Docker installed on your machine
- Docker Compose installed on your machine
- Docker daemon running (start Docker Desktop or the Docker service on your system)

## Docker Files

- `Dockerfile`: Defines how to build the Billing Service Docker image
- `docker-compose.yml`: Defines the services needed to run the Billing Service, including MongoDB, Kafka, Zookeeper, and Redis
- `docker-simple.sh`: A simplified script for building and running just the Billing Service in demo mode
- `MACOS_DOCKER_GUIDE.md`: Detailed instructions for starting Docker on macOS

## Building and Running the Billing Service

### Option 1: Using Docker Compose (Recommended)

This option will build and start the Billing Service along with all its dependencies (MongoDB, Kafka, Zookeeper, Redis).

```bash
# Navigate to the billing service directory
cd uber-simulation-system/middleware/services/billing

# Build and start all services
docker-compose up -d

# To view logs
docker-compose logs -f

# To stop all services
docker-compose down
```

### Option 2: Building and Running Only the Billing Service

If you already have MongoDB, Kafka, and Redis running elsewhere, you can build and run just the Billing Service.

```bash
# Navigate to the billing service directory
cd uber-simulation-system/middleware/services/billing

# Build the Docker image
docker build -t uber-billing-service .

# Run the container
docker run -d \
  --name uber-billing-service \
  -p 3003:3003 \
  -e MONGODB_URI=mongodb://your-mongodb-host:27017/uber_simulation \
  -e KAFKA_BROKER=your-kafka-host:9092 \
  -e REDIS_ENABLED=false \
  -e JWT_SECRET=your_secret_key \
  uber-billing-service
```

Replace `your-mongodb-host` and `your-kafka-host` with the actual hostnames or IP addresses of your MongoDB and Kafka instances.

## Environment Variables

The Billing Service container uses the following environment variables:

- `MONGODB_URI`: MongoDB connection string
- `BILLING_SERVICE_PORT`: Port on which the Billing Service runs (default: 3003)
- `KAFKA_BROKER`: Kafka broker address
- `REDIS_ENABLED`: Whether Redis is enabled (true/false)
- `REDIS_HOST`: Redis host address
- `REDIS_PORT`: Redis port
- `JWT_SECRET`: Secret key for JWT token generation/validation

## Accessing the Service

Once the container is running, the Billing Service will be available at:

- API: http://localhost:3003/api/v1/bills and http://localhost:3003/api/v1/pricing
- Health check: http://localhost:3003/health

## Demo Mode

The Billing Service can run in a special "demo mode" that doesn't require MongoDB, Kafka, or Redis to be running. This is useful for:

- Quick testing of the API endpoints
- Demonstrating the service without setting up the full infrastructure
- Development and debugging

In demo mode:
- MongoDB connection failures are handled gracefully
- Kafka connection failures are handled gracefully
- Redis is mocked with an in-memory implementation

To run the service in demo mode, use the `docker-simple.sh` script or build the Docker image directly from the Dockerfile, which is configured for demo mode by default.

```bash
# Using the script
./docker-simple.sh

# Or manually
docker build -t uber-billing-service .
docker run -d -p 3003:3003 --name uber-billing-service uber-billing-service
```

You can check the service status by accessing the health endpoint:
```
http://localhost:3003/health
```

## Troubleshooting

If you encounter issues:

1. **Docker daemon not running**: If you see an error like "Cannot connect to the Docker daemon", make sure Docker is running:
   - On macOS: Start Docker Desktop application
   - On Windows: Start Docker Desktop application
   - On Linux: Run `sudo systemctl start docker`

2. Check if all containers are running: `docker ps`
3. View container logs: `docker logs uber-billing-service`
4. Ensure all required environment variables are set correctly
5. Verify that MongoDB, Kafka, and Redis are accessible from the Billing Service container (not required in demo mode)