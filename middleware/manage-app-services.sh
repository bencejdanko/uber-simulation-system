#!/bin/bash

# Script to stop, rebuild, and launch specific application services
# This script targets services defined in the docker-compose.yml in the current directory.

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the application services to manage
# Excludes core services like broker, redis, mongo, and init containers like broker-init
APP_SERVICES="admin-service auth-service billing-service customer-service driver-service rides-service model-prediction"

echo "--- Managing Application Services ---"
echo "Services to be affected: $APP_SERVICES"
echo ""

# Step 1: Stop and remove existing containers, networks, and anonymous volumes for these services
# This ensures a clean start and avoids conflicts.
echo "Step 1: Stopping and removing specified application services..."
docker-compose down $APP_SERVICES
echo "Done."
echo ""

# Step 2: Rebuild the specified application services
echo "Step 2: Rebuilding application services..."
docker-compose build $APP_SERVICES
echo "Build complete."
echo ""

# Step 3: Launch the application services in detached mode
# This will also start any dependencies if they are not already running.
echo "Step 3: Launching application services in detached mode..."
docker-compose up -d $APP_SERVICES
echo "Application services launched."
echo ""

echo "--- Operation Complete ---"
echo "You can check the status of all services with: docker-compose ps"
echo "To view logs for a specific service (e.g., admin-service): docker-compose logs -f admin-service"
echo "To view logs for all managed app services: docker-compose logs -f $APP_SERVICES"
