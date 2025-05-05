#!/bin/bash

# Simple script to build and run the Billing Service Docker image
# This script doesn't require Docker Compose or other dependencies
# The service will run in demo mode, where MongoDB and Kafka connections are optional

# Set script to exit on error
set -e

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
  print_message "On macOS: Start Docker Desktop application (see MACOS_DOCKER_GUIDE.md)"
  exit 1
fi

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the billing service directory
cd "$DIR"

# Display menu
echo "===== Uber Billing Service Docker Operations ====="
echo "1. Build the Billing Service image"
echo "2. Run the Billing Service container"
echo "3. Stop the Billing Service container"
echo "4. View logs"
echo "5. Exit"
echo "=================================================="

# Get user choice
read -p "Enter your choice (1-5): " choice

case $choice in
  1)
    print_message "Building the Billing Service Docker image..."
    docker build -t uber-billing-service .
    print_message "Billing Service image built successfully."
    ;;
  2)
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
      uber-billing-service
    
    print_message "Billing Service container started in DEMO MODE. Available at http://localhost:3003"
    print_message "Note: In demo mode, MongoDB and Kafka connections are optional."
    print_message "Check the health endpoint at http://localhost:3003/health"
    ;;
  3)
    print_message "Stopping the Billing Service container..."
    docker stop uber-billing-service || true
    docker rm uber-billing-service || true
    print_message "Billing Service container stopped."
    ;;
  4)
    print_message "Viewing logs for the Billing Service container..."
    docker logs -f uber-billing-service
    ;;
  5)
    print_message "Exiting..."
    exit 0
    ;;
  *)
    print_error "Invalid choice. Please enter a number between 1 and 5."
    exit 1
    ;;
esac