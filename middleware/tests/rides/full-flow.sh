#!/bin/bash

# === Configuration ===
KONG_PROXY_PORT=8000
AUTH_BASE_URL="http://localhost:$KONG_PROXY_PORT/api/v1/auth"
RIDES_BASE_URL="http://localhost:$KONG_PROXY_PORT/api/v1/rides"
PASSWORD="StrongPassword123!"
LOG_FILE="test_run_$(date +%Y%m%d_%H%M%S).log"

# === Color Definitions ===
C_RESET='\e[0m'
C_RED='\e[0;31m'
C_GREEN='\e[0;32m'
C_YELLOW='\e[0;33m'
C_BLUE='\e[0;34m'
C_CYAN='\e[0;36m'
C_BOLD='\e[1m'
C_DIM='\e[2m'

# === Log File Setup ===
exec > >(tee -a "$LOG_FILE") 2>&1
echo "Logging all output to: $LOG_FILE"
echo "Script started at: $(date)"
echo "-----------------------------------------------------"

# === Dependency Check ===
if ! command -v jq &> /dev/null; then
    echo -e "${C_RED}${C_BOLD}Error: 'jq' command not found. Please install jq.${C_RESET}"
    exit 1
fi
if ! command -v curl &> /dev/null; then
    echo -e "${C_RED}${C_BOLD}Error: 'curl' command not found. Please install curl.${C_RESET}"
    exit 1
fi

# === Summary Tracking ===
declare -A TEST_PASS_COUNTS
declare -A TEST_FAIL_COUNTS
TOTAL_PASS=0
TOTAL_FAIL=0

# Function to record test results
record_result() {
    local test_name="$1"
    local passed=$2 # boolean true/false
    if [ "$passed" = true ]; then
        TEST_PASS_COUNTS[$test_name]=$((TEST_PASS_COUNTS[$test_name] + 1))
        TOTAL_PASS=$((TOTAL_PASS + 1))
    else
        TEST_FAIL_COUNTS[$test_name]=$((TEST_FAIL_COUNTS[$test_name] + 1))
        TOTAL_FAIL=$((TOTAL_FAIL + 1))
    fi
}

# Function to make authenticated requests
make_request() {
    local method="$1"
    local url="$2"
    local data="$3"
    local token="$4"
    
    if [ -z "$data" ]; then
        curl -s -X "$method" "$url" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json"
    else
        curl -s -X "$method" "$url" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data"
    fi
}

# Function to test ride creation
test_create_ride() {
    echo -e "\n${C_BOLD}Testing Ride Creation${C_RESET}"
    local token="$1"
    local test_name="create_ride"
    
    local ride_data='{
        "pickupLocation": {
            "latitude": 40.7128,
            "longitude": -74.0060
        },
        "dropoffLocation": {
            "latitude": 40.7580,
            "longitude": -73.9855
        },
        "vehicleType": "STANDARD",
        "paymentMethod": "CREDIT_CARD"
    }'
    
    local response=$(make_request "POST" "$RIDES_BASE_URL" "$ride_data" "$token")
    local status_code=$(echo "$response" | jq -r '.statusCode // 200')
    
    if [ "$status_code" = "202" ]; then
        echo -e "${C_GREEN}✓ Ride creation successful${C_RESET}"
        record_result "$test_name" true
        echo "$response" | jq '.'
        return $(echo "$response" | jq -r '.id')
    else
        echo -e "${C_RED}✗ Ride creation failed${C_RESET}"
        record_result "$test_name" false
        echo "$response" | jq '.'
        return ""
    fi
}

# Function to test ride status update
test_update_ride_status() {
    echo -e "\n${C_BOLD}Testing Ride Status Update${C_RESET}"
    local token="$1"
    local ride_id="$2"
    local test_name="update_ride_status"
    
    local status_data='{
        "status": "ACCEPTED"
    }'
    
    local response=$(make_request "PUT" "$RIDES_BASE_URL/$ride_id/status" "$status_data" "$token")
    local status_code=$(echo "$response" | jq -r '.statusCode // 200')
    
    if [ "$status_code" = "200" ]; then
        echo -e "${C_GREEN}✓ Ride status update successful${C_RESET}"
        record_result "$test_name" true
        echo "$response" | jq '.'
    else
        echo -e "${C_RED}✗ Ride status update failed${C_RESET}"
        record_result "$test_name" false
        echo "$response" | jq '.'
    fi
}

# Function to test ride cancellation
test_cancel_ride() {
    echo -e "\n${C_BOLD}Testing Ride Cancellation${C_RESET}"
    local token="$1"
    local ride_id="$2"
    local test_name="cancel_ride"
    
    local cancel_data='{
        "reason": "Customer requested cancellation"
    }'
    
    local response=$(make_request "POST" "$RIDES_BASE_URL/$ride_id/cancel" "$cancel_data" "$token")
    local status_code=$(echo "$response" | jq -r '.statusCode // 200')
    
    if [ "$status_code" = "204" ]; then
        echo -e "${C_GREEN}✓ Ride cancellation successful${C_RESET}"
        record_result "$test_name" true
    else
        echo -e "${C_RED}✗ Ride cancellation failed${C_RESET}"
        record_result "$test_name" false
        echo "$response" | jq '.'
    fi
}

# Function to test getting ride details
test_get_ride() {
    echo -e "\n${C_BOLD}Testing Get Ride Details${C_RESET}"
    local token="$1"
    local ride_id="$2"
    local test_name="get_ride"
    
    local response=$(make_request "GET" "$RIDES_BASE_URL/$ride_id" "" "$token")
    local status_code=$(echo "$response" | jq -r '.statusCode // 200')
    
    if [ "$status_code" = "200" ]; then
        echo -e "${C_GREEN}✓ Get ride details successful${C_RESET}"
        record_result "$test_name" true
        echo "$response" | jq '.'
    else
        echo -e "${C_RED}✗ Get ride details failed${C_RESET}"
        record_result "$test_name" false
        echo "$response" | jq '.'
    fi
}

# Main test flow
main() {
    echo -e "${C_BOLD}Starting Rides Service Tests${C_RESET}"
    
    # Get authentication token (you'll need to implement this based on your auth service)
    local token=$(get_auth_token)
    if [ -z "$token" ]; then
        echo -e "${C_RED}Failed to get authentication token${C_RESET}"
        exit 1
    fi
    
    # Test ride creation
    local ride_id=$(test_create_ride "$token")
    if [ -z "$ride_id" ]; then
        echo -e "${C_RED}Failed to create ride, cannot continue tests${C_RESET}"
        exit 1
    fi
    
    # Test getting ride details
    test_get_ride "$token" "$ride_id"
    
    # Test updating ride status
    test_update_ride_status "$token" "$ride_id"
    
    # Test ride cancellation
    test_cancel_ride "$token" "$ride_id"
    
    # Print summary
    echo -e "\n${C_BOLD}Test Summary:${C_RESET}"
    echo -e "Total Passed: ${C_GREEN}$TOTAL_PASS${C_RESET}"
    echo -e "Total Failed: ${C_RED}$TOTAL_FAIL${C_RESET}"
    
    if [ $TOTAL_FAIL -gt 0 ]; then
        exit 1
    fi
}

# Run the main function
main 