#!/bin/bash

# Integration Tests for Billing Service using curl
# This script assumes the billing service is already running via 'npm start'

# Display setup instructions
echo "==================================================="
echo "   Billing Service Integration Test Setup"
echo "==================================================="
echo "Before running these tests, make sure:"
echo "1. MongoDB is running"
echo "2. The .env file is properly configured"
echo "3. Run 'node tests/integration/setup-test-db.js' to set up test data"
echo "4. Start the billing service with 'npm start'"
echo "==================================================="
echo ""

# Configuration
BASE_URL="http://localhost:3003"  # Adjust this to match your service's port
BILLS_ENDPOINT="/api/bills"
PRICING_ENDPOINT="/api/pricing"
# Generate unique IDs in SSN format (xxx-xx-xxxx)
# Use current seconds and a random number to ensure uniqueness
SECONDS_NOW=$(date +%S)
RANDOM_NUM=$(( RANDOM % 100 ))
BILL_ID="123-45-$(printf "%04d" $(( SECONDS_NOW * 100 + RANDOM_NUM )))"
CUSTOMER_ID="234-56-7890"
DRIVER_ID="345-67-8901"
RIDE_ID="456-78-$(printf "%04d" $(( SECONDS_NOW * 100 + RANDOM_NUM + 1 )))"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set permissions for the token generator script if it exists
if [ -f "$(dirname "$0")/generate-token.js" ]; then
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
    AUTH_HEADER="-H \"Authorization: Bearer $JWT_TOKEN\""
else
    echo "No token generator found. Running tests without authentication."
    AUTH_HEADER=""
fi

# Combine to full URLs
BILLS_URL="${BASE_URL}${BILLS_ENDPOINT}"
PRICING_URL="${BASE_URL}${PRICING_ENDPOINT}"

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
    echo -e "${RED}Error: Billing service does not appear to be running.${NC}"
    echo "Please start the service with 'npm start' before running the tests."
    exit 1
fi

echo -e "${GREEN}✓ Service is running${NC}"

echo "==================================================="
echo "   Billing Service Integration Tests with curl"
echo "==================================================="
echo "Starting tests against $BASE_URL"

# ------------------------------------------------------
# TEST SUITE: Create Bill
# ------------------------------------------------------
print_section "POST /api/bills - Create Bill"

# Test: Create a new bill with valid data
echo "Testing: should create a new bill with valid data"
CREATE_RESPONSE=$(curl -s -X POST "$BILLS_URL" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER \
  -d '{
    "billingId": "'"$BILL_ID"'",
    "rideId": "'"$RIDE_ID"'",
    "customerId": "'"$CUSTOMER_ID"'",
    "driverId": "'"$DRIVER_ID"'",
    "date": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
    "pickupTime": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
    "dropoffTime": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
    "distanceCovered": 10.5,
    "sourceLocation": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "addressLine": "123 Main St, San Francisco, CA"
    },
    "destinationLocation": {
      "latitude": 37.3352,
      "longitude": -121.8811,
      "addressLine": "456 Market St, San Jose, CA"
    },
    "predictedAmount": 35.50,
    "actualAmount": 42.75
  }')

# Check if the response contains the expected bill ID
if [[ "$CREATE_RESPONSE" == *"\"billingId\":\"$BILL_ID\""* ]]; then
    print_result 0 "Bill creation with valid data" "$CREATE_RESPONSE"
else
    print_result 1 "Failed to create bill with valid data" "$CREATE_RESPONSE"
fi

# Test: Missing required fields
echo "Testing: should return 400 for missing required fields"
INVALID_RESPONSE=$(curl -s -X POST "$BILLS_URL" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER \
  -d '{
    "customerId": "'"$CUSTOMER_ID"'",
    "driverId": "'"$DRIVER_ID"'"
  }' \
  -o /tmp/invalid_response \
  -w "%{http_code}")

RESPONSE_BODY=$(cat /tmp/invalid_response)
# Check if the response contains the expected error message
if [[ "$RESPONSE_BODY" == *"missing_required_field"* ]]; then
    print_result 0 "Return 400 for missing required fields" "$RESPONSE_BODY"
else
    print_result 1 "Expected error message for missing fields not found" "$RESPONSE_BODY"
fi

# ------------------------------------------------------
# TEST SUITE: Get Bill by ID
# ------------------------------------------------------
print_section "GET /api/bills/:billing_id - Get Bill by ID"

# Test: Retrieve a bill by ID
echo "Testing: should retrieve a bill by ID"
GET_RESPONSE=$(curl -s -X GET "$BILLS_URL/$BILL_ID" $AUTH_HEADER)

# Check if the response contains the expected bill ID
if [[ "$GET_RESPONSE" == *"\"billingId\":\"$BILL_ID\""* ]]; then
    print_result 0 "Retrieve a bill by ID" "$GET_RESPONSE"
else
    print_result 1 "Failed to retrieve bill by ID" "$GET_RESPONSE"
fi

# Test: Non-existent bill ID
echo "Testing: should return 404 for non-existent bill ID"
NOT_FOUND_RESPONSE=$(curl -s -X GET "$BILLS_URL/999-99-9999" \
  $AUTH_HEADER \
  -o /tmp/not_found_response \
  -w "%{http_code}")

RESPONSE_BODY=$(cat /tmp/not_found_response)
# Check if the response contains the expected error message
if [[ "$RESPONSE_BODY" == *"bill_not_found"* ]]; then
    print_result 0 "Return 404 for non-existent bill ID" "$RESPONSE_BODY"
else
    print_result 1 "Expected error message for non-existent ID not found" "$RESPONSE_BODY"
fi

# ------------------------------------------------------
# TEST SUITE: Search Bills
# ------------------------------------------------------
print_section "GET /api/bills - Search Bills"

# Test: Search bills by customer ID
echo "Testing: should search bills by customer ID"
SEARCH_RESPONSE=$(curl -s -X GET "$BILLS_URL?customer_id=$CUSTOMER_ID" $AUTH_HEADER)

# Check if the response contains our bill
if [[ "$SEARCH_RESPONSE" == *"\"customerId\":\"$CUSTOMER_ID\""* ]]; then
    print_result 0 "Search bills by customer ID" "$SEARCH_RESPONSE"
else
    print_result 1 "Failed to search bills by customer ID" "$SEARCH_RESPONSE"
fi

# ------------------------------------------------------
# TEST SUITE: Update Payment Status
# ------------------------------------------------------
print_section "PATCH /api/bills/:billing_id/payment - Update Payment Status"

# Test: Update payment status
echo "Testing: should update payment status"
UPDATE_RESPONSE=$(curl -s -X PATCH "$BILLS_URL/$BILL_ID/payment" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER \
  -d '{
    "status": "PAID",
    "paymentDetails": {
      "method": "CREDIT_CARD",
      "last4": "4242",
      "transactionId": "txn_123456789"
    }
  }')

# Check if the response contains the updated payment status
if [[ "$UPDATE_RESPONSE" == *"\"paymentStatus\":\"PAID\""* ]]; then
    print_result 0 "Update payment status" "$UPDATE_RESPONSE"
else
    print_result 1 "Failed to update payment status" "$UPDATE_RESPONSE"
fi

# ------------------------------------------------------
# TEST SUITE: Pricing Endpoints
# ------------------------------------------------------
print_section "POST /api/pricing/predict - Calculate Predicted Fare"

# Test: Calculate predicted fare
echo "Testing: should calculate predicted fare"
PREDICT_RESPONSE=$(curl -s -X POST "$PRICING_URL/predict" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER \
  -d '{
    "pickup": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "dropoff": {
      "latitude": 37.3352,
      "longitude": -121.8811
    },
    "requestTime": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"
  }')

# Check if the response contains fare details
if [[ "$PREDICT_RESPONSE" == *"fare"* ]]; then
    print_result 0 "Calculate predicted fare" "$PREDICT_RESPONSE"
else
    print_result 1 "Failed to calculate predicted fare" "$PREDICT_RESPONSE"
fi

print_section "POST /api/pricing/distance - Calculate Distance"

# Test: Calculate distance
echo "Testing: should calculate distance between two points"
DISTANCE_RESPONSE=$(curl -s -X POST "$PRICING_URL/distance" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER \
  -d '{
    "pickup": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "dropoff": {
      "latitude": 37.3352,
      "longitude": -121.8811
    }
  }')

# Check if the response contains distance
if [[ "$DISTANCE_RESPONSE" == *"distance"* ]]; then
    print_result 0 "Calculate distance" "$DISTANCE_RESPONSE"
else
    print_result 1 "Failed to calculate distance" "$DISTANCE_RESPONSE"
fi

print_section "POST /api/pricing/time - Estimate Travel Time"

# Test: Estimate travel time
echo "Testing: should estimate travel time"
TIME_RESPONSE=$(curl -s -X POST "$PRICING_URL/time" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER \
  -d '{
    "distance": 50,
    "timeOfDay": "morning"
  }')

# Check if the response contains travel time
if [[ "$TIME_RESPONSE" == *"travelTime"* ]]; then
    print_result 0 "Estimate travel time" "$TIME_RESPONSE"
else
    print_result 1 "Failed to estimate travel time" "$TIME_RESPONSE"
fi

# ------------------------------------------------------
# TEST SUITE: Delete Bill
# ------------------------------------------------------
print_section "DELETE /api/bills/:billing_id - Delete Bill"

# Test: Delete a bill
echo "Testing: should delete a bill"
DELETE_RESPONSE=$(curl -s -X DELETE "$BILLS_URL/$BILL_ID" \
  $AUTH_HEADER \
  -o /tmp/delete_response \
  -w "%{http_code}")

RESPONSE_BODY=$(cat /tmp/delete_response)
# For DELETE, an empty response body typically indicates success
if [ -z "$RESPONSE_BODY" ]; then
    print_result 0 "Delete a bill" "No content (204 response)"
else
    print_result 1 "Expected empty response for successful deletion" "$RESPONSE_BODY"
fi

# Test: Verify bill was deleted
echo "Testing: should return 404 for deleted bill"
DELETED_BILL_RESPONSE=$(curl -s -X GET "$BILLS_URL/$BILL_ID" \
  $AUTH_HEADER \
  -o /tmp/deleted_bill_response \
  -w "%{http_code}")

RESPONSE_BODY=$(cat /tmp/deleted_bill_response)
# Check if the response contains the expected error message
if [[ "$RESPONSE_BODY" == *"bill_not_found"* ]]; then
    print_result 0 "Return 404 for deleted bill" "$RESPONSE_BODY"
else
    print_result 1 "Expected error message for deleted bill not found" "$RESPONSE_BODY"
fi

# ------------------------------------------------------
# Cleanup temporary files
# ------------------------------------------------------
rm -f /tmp/invalid_response /tmp/not_found_response /tmp/delete_response /tmp/deleted_bill_response

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
