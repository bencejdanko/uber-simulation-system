#!/bin/bash

# Script to build and run the Billing Service Docker image

# Set script to exit on error
set -e

# Print commands before executing
set -x

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  print_error "Docker is not installed. Please install Docker first."
  exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
  print_error "Docker daemon is not running. Please start Docker first."
  print_message "On macOS/Windows: Start Docker Desktop application"
  print_message "On Linux: Run 'sudo systemctl start docker'"
  exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
  print_warning "Docker Compose is not installed. Only Docker commands will be available."
  DOCKER_COMPOSE_AVAILABLE=false
else
  DOCKER_COMPOSE_AVAILABLE=true
fi

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the billing service directory
cd "$DIR"

# Display menu
echo "===== Uber Billing Service Docker Operations ====="
echo "1. Build and run with Docker Compose (all services)"
echo "2. Build only the Billing Service image"
echo "3. Run only the Billing Service container"
echo "4. Stop all services"
echo "5. View logs"
echo "6. Exit"
echo "=================================================="

# Get user choice
read -p "Enter your choice (1-6): " choice

case $choice in
  1)
    if [ "$DOCKER_COMPOSE_AVAILABLE" = true ]; then
      print_message "Building and starting all services with Docker Compose..."
      docker-compose up -d
      print_message "All services started. Billing Service is available at http://localhost:3003"
    else
      print_error "Docker Compose is not installed. Please install it first."
      exit 1
    fi
    ;;
  2)
    print_message "Building the Billing Service Docker image..."
    docker build -t uber-billing-service .
    print_message "Billing Service image built successfully."
    ;;
  3)
    print_message "Running the Billing Service container..."
    # Check if container already exists
    if docker ps -a --format '{{.Names}}' | grep -q "^uber-billing-service$"; then
      print_warning "Container 'uber-billing-service' already exists. Removing it..."
      docker rm -f uber-billing-service
    fi
    
    # Run the container
    docker run -d \
      --name uber-billing-service \
      -p 3003:3003 \
      -e MONGODB_URI=mongodb://localhost:27017/uber_simulation \
      -e KAFKA_BROKER=localhost:9092 \
      -e REDIS_ENABLED=false \
      -e JWT_SECRET=your_secret_key \
      uber-billing-service
    
    print_message "Billing Service container started. Available at http://localhost:3003"
    ;;
  4)
    if [ "$DOCKER_COMPOSE_AVAILABLE" = true ]; then
      print_message "Stopping all services..."
      docker-compose down
      print_message "All services stopped."
    else
      print_message "Stopping the Billing Service container..."
      docker stop uber-billing-service || true
      docker rm uber-billing-service || true
      print_message "Billing Service container stopped."
    fi
    ;;
  5)
    if [ "$DOCKER_COMPOSE_AVAILABLE" = true ]; then
      print_message "Viewing logs for all services..."
      docker-compose logs -f
    else
      print_message "Viewing logs for the Billing Service container..."
      docker logs -f uber-billing-service
    fi
    ;;
  6)
    print_message "Exiting..."
    exit 0
    ;;
  *)
    print_error "Invalid choice. Please enter a number between 1 and 6."
    exit 1
    ;;
esac