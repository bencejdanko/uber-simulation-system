#!/bin/bash

# Integration Tests for Driver Service using curl
# This script assumes the driver service is already running via 'pnpm start'

# Configuration
BASE_URL="http://localhost:3000"  # Adjust this to match your service's port
DRIVER_ID="123-45-6789"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set permissions for the token generator script
chmod +x "$(dirname "$0")/generate-token.js"

# Generate a valid JWT token using the token generator script
echo "Generating valid JWT token for testing..."
JWT_TOKEN=$(node "$(dirname "$0")/generate-token.js")

if [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}Failed to generate JWT token. Make sure jsonwebtoken is installed:${NC}"
    echo "npm install jsonwebtoken"
    exit 1
fi

echo -e "${BLUE}Using JWT token:${NC} $JWT_TOKEN"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to print test results
print_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS:${NC} $2"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL:${NC} $2"
        echo -e "${YELLOW}  Response:${NC} $3"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Function to print section headers
print_section() {
    echo -e "\n${YELLOW}=== $1 ===${NC}"
}

# Check if the service is running and healthy
print_section "Health Check"
echo "Testing: Service health endpoint"
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
HEALTH_STATUS=$?

if [ $HEALTH_STATUS -ne 0 ]; then
    echo -e "${RED}Error: Driver service does not appear to be running.${NC}"
    echo "Please start the service with 'pnpm start' before running the tests."
    exit 1
fi

echo -e "${GREEN}✓ Service is running:${NC} $HEALTH_RESPONSE"

echo "==================================================="
echo "   Driver Service Integration Tests with curl"
echo "==================================================="
echo "Starting tests against $BASE_URL"
echo "Using driver ID: $DRIVER_ID"

# ------------------------------------------------------
# TEST SUITE: Create Driver
# ------------------------------------------------------
print_section "POST /drivers - Create Driver"

# Test: Create a new driver with valid data
echo "Testing: should create a new driver with valid data"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/drivers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "driverId": "'"$DRIVER_ID"'",
    "firstName": "John",
    "lastName": "Doe",
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345"
    },
    "phoneNumber": "123-456-7890",
    "email": "john.doe@example.com",
    "carDetails": {
      "make": "Toyota",
      "model": "Camry",
      "year": 2020,
      "color": "Blue",
      "licensePlate": "ABC123"
    },
    "introduction": {
      "imageUrl": "http://example.com/image.jpg",
      "videoUrl": "http://example.com/video.mp4"
    }
  }')

CREATE_STATUS=$(echo "$CREATE_RESPONSE" | grep -c "\"driverId\":\"$DRIVER_ID\"" || echo "0")
print_result $CREATE_STATUS "Driver creation with valid data" "$CREATE_RESPONSE"

# Test: Missing required fields
echo "Testing: should return 400 for missing required fields"
INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/drivers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "firstName": "Missing",
    "lastName": "Fields"
  }' \
  -o /tmp/invalid_response \
  -w "%{http_code}")

RESPONSE_BODY=$(cat /tmp/invalid_response)
if [ "$INVALID_RESPONSE" -eq 400 ]; then
    print_result 0 "Return 400 for missing required fields" "$RESPONSE_BODY"
else
    print_result 1 "Expected 400 for missing fields but got $INVALID_RESPONSE" "$RESPONSE_BODY"
fi

# Test: Missing authorization
echo "Testing: should return 401 when authorization is missing"
UNAUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/drivers" \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "unauth-test",
    "firstName": "No",
    "lastName": "Auth"
  }' \
  -o /tmp/unauth_response \
  -w "%{http_code}")

RESPONSE_BODY=$(cat /tmp/unauth_response)
if [ "$UNAUTH_RESPONSE" -eq 401 ]; then
    print_result 0 "Return 401 when authorization is missing" "$RESPONSE_BODY"
else
    print_result 1 "Expected 401 for missing auth but got $UNAUTH_RESPONSE" "$RESPONSE_BODY"
fi

# Test: Invalid authorization token
echo "Testing: should return 401 when token is invalid"
INVALID_TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/drivers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid.token.here" \
  -d '{
    "driverId": "invalid-token-test",
    "firstName": "Invalid",
    "lastName": "Token"
  }' \
  -o /tmp/invalid_token_response \
  -w "%{http_code}")

RESPONSE_BODY=$(cat /tmp/invalid_token_response)
if [ "$INVALID_TOKEN_RESPONSE" -eq 401 ]; then
    print_result 0 "Return 401 when token is invalid" "$RESPONSE_BODY"
else
    print_result 1 "Expected 401 for invalid token but got $INVALID_TOKEN_RESPONSE" "$RESPONSE_BODY"
fi

# ------------------------------------------------------
# TEST SUITE: Get Driver by ID
# ------------------------------------------------------
print_section "GET /drivers/:driver_id - Get Driver by ID"

# Test: Retrieve a driver by ID
echo "Testing: should retrieve a driver by ID"
GET_RESPONSE=$(curl -s -X GET "$BASE_URL/drivers/$DRIVER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN")

GET_STATUS=$(echo "$GET_RESPONSE" | grep -c "\"driverId\":\"$DRIVER_ID\"" || echo "0")
print_result $GET_STATUS "Retrieve a driver by ID" "$GET_RESPONSE"

# Test: Non-existent driver ID
echo "Testing: should return 404 for non-existent driver ID"
NOT_FOUND_RESPONSE=$(curl -s -X GET "$BASE_URL/drivers/non-existent-id" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -o /tmp/not_found_response \
  -w "%{http_code}")

RESPONSE_BODY=$(cat /tmp/not_found_response)
if [ "$NOT_FOUND_RESPONSE" -eq 404 ]; then
    print_result 0 "Return 404 for non-existent driver ID" "$RESPONSE_BODY"
else
    print_result 1 "Expected 404 for non-existent ID but got $NOT_FOUND_RESPONSE" "$RESPONSE_BODY"
fi

# ------------------------------------------------------
# TEST SUITE: Update Driver
# ------------------------------------------------------
print_section "PATCH /drivers/:driver_id - Update Driver"

# Test: Update driver information
echo "Testing: should update driver information"
UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/drivers/$DRIVER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "phoneNumber": "987-654-3210"
  }')

UPDATE_STATUS=$(echo "$UPDATE_RESPONSE" | grep -c "\"firstName\":\"Jane\"" || echo "0")
print_result $UPDATE_STATUS "Update driver information" "$UPDATE_RESPONSE"

# Test: Partial update of nested objects
echo "Testing: should partially update nested objects"
PARTIAL_UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/drivers/$DRIVER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "address": {
      "city": "New City",
      "state": "NY"
    },
    "carDetails": {
      "color": "Red"
    }
  }')

PARTIAL_UPDATE_STATUS=$(echo "$PARTIAL_UPDATE_RESPONSE" | grep -c "\"city\":\"New City\"" || echo "0")
print_result $PARTIAL_UPDATE_STATUS "Partial update of nested objects" "$PARTIAL_UPDATE_RESPONSE"

# ------------------------------------------------------
# TEST SUITE: Update Driver Location
# ------------------------------------------------------
print_section "PATCH /drivers/:driver_id/location - Update Driver Location"

# Test: Update driver location
echo "Testing: should update driver location"
CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOCATION_UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/drivers/$DRIVER_ID/location" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "timestamp": "'"$CURRENT_TIME"'"
  }')

LOCATION_UPDATE_STATUS=$(echo "$LOCATION_UPDATE_RESPONSE" | grep -c "\"latitude\":37.7749" || echo "0")
print_result $LOCATION_UPDATE_STATUS "Update driver location" "$LOCATION_UPDATE_RESPONSE"

# ------------------------------------------------------
# TEST SUITE: List Drivers
# ------------------------------------------------------
print_section "GET /drivers - List Drivers"

# Test: List all drivers
echo "Testing: should list all drivers"
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/drivers" \
  -H "Authorization: Bearer $JWT_TOKEN")

# Check if the response is a non-empty array (starts with [ and has content)
if [[ "$LIST_RESPONSE" == \[*\] && "$LIST_RESPONSE" != "[]" ]]; then
    print_result 0 "List all drivers" "$LIST_RESPONSE"
else
    print_result 1 "Failed to list drivers or got empty list" "$LIST_RESPONSE"
fi

# ------------------------------------------------------
# TEST SUITE: Driver Search
# ------------------------------------------------------
print_section "GET /drivers/search - Search Drivers"

# Test: Search drivers by name
echo "Testing: should search drivers by name"
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/drivers/search?name=Jane" \
  -H "Authorization: Bearer $JWT_TOKEN")

# Check if the response contains our updated driver name
SEARCH_STATUS=$(echo "$SEARCH_RESPONSE" | grep -c "\"firstName\":\"Jane\"" || echo "0")
print_result $SEARCH_STATUS "Search drivers by name" "$SEARCH_RESPONSE"

# ------------------------------------------------------
# TEST SUITE: Delete Driver
# ------------------------------------------------------
print_section "DELETE /drivers/:driver_id - Delete Driver"

# Test: Delete a driver
echo "Testing: should delete a driver"
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/drivers/$DRIVER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -o /tmp/delete_response \
  -w "%{http_code}")

RESPONSE_BODY=$(cat /tmp/delete_response)
if [ "$DELETE_RESPONSE" -eq 204 ]; then
    print_result 0 "Delete a driver" "No content (204 response)"
else
    print_result 1 "Expected 204 for successful deletion but got $DELETE_RESPONSE" "$RESPONSE_BODY"
fi

# Test: Verify driver was deleted
echo "Testing: should return 404 for deleted driver"
DELETED_DRIVER_RESPONSE=$(curl -s -X GET "$BASE_URL/drivers/$DRIVER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -o /tmp/deleted_driver_response \
  -w "%{http_code}")

RESPONSE_BODY=$(cat /tmp/deleted_driver_response)
if [ "$DELETED_DRIVER_RESPONSE" -eq 404 ]; then
    print_result 0 "Return 404 for deleted driver" "$RESPONSE_BODY"
else
    print_result 1 "Expected 404 for deleted driver but got $DELETED_DRIVER_RESPONSE" "$RESPONSE_BODY"
fi

# ------------------------------------------------------
# Cleanup temporary files
# ------------------------------------------------------
rm -f /tmp/invalid_response /tmp/unauth_response /tmp/not_found_response /tmp/delete_response /tmp/deleted_driver_response /tmp/invalid_token_response

# ------------------------------------------------------
# Summary of test results
# ------------------------------------------------------
echo -e "\n==================================================="
echo "               Test Results Summary"
echo "==================================================="
echo -e "Total tests: $TOTAL_TESTS"
echo -e "${GREEN}Tests passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests failed: $TESTS_FAILED${NC}"

# Return exit code based on test results
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed successfully!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Please check the output above.${NC}"
    exit 1
fi