#!/bin/bash

# === Configuration ===
KONG_PROXY_PORT=8000 # Adjust if your Kong proxy runs on a different port
AUTH_BASE_URL="http://localhost:$KONG_PROXY_PORT/api/v1/auth"
BILLING_BASE_URL="http://localhost:$KONG_PROXY_PORT/api/v1/bills" # Target Kong proxy for billing service
PASSWORD="StrongPassword123!" # Use a known password for registration
NUM_DRIVERS_TO_REGISTER=1 # Only need one driver for authentication token
LOG_FILE="billing_test_run_$(date +%Y%m%d_%H%M%S).log" # Log file name

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

generate_ssn_format_id() {
    printf "%03d-%02d-%04d" $((RANDOM % 1000)) $((RANDOM % 100)) $((RANDOM % 10000))
}

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

    if $passed; then
        TEST_PASS_COUNTS["$test_name"]=$(( ${TEST_PASS_COUNTS["$test_name"]:-0} + 1 ))
        TOTAL_PASS=$((TOTAL_PASS + 1))
    else
        TEST_FAIL_COUNTS["$test_name"]=$(( ${TEST_FAIL_COUNTS["$test_name"]:-0} + 1 ))
        TOTAL_FAIL=$((TOTAL_FAIL + 1))
    fi
}

# Function to print the final summary
print_summary() {
    echo -e "\n${C_BLUE}${C_BOLD}=== Test Summary ===${C_RESET}"
    echo "-----------------------------------------------------"

    local -a sorted_unique_keys
    mapfile -t sorted_unique_keys < <(printf '%s\n' "${!TEST_PASS_COUNTS[@]}" "${!TEST_FAIL_COUNTS[@]}" | sort -u)

    if [ ${#sorted_unique_keys[@]} -eq 0 ]; then
        echo -e "${C_YELLOW}No test results recorded.${C_RESET}"
    else
        for test_name in "${sorted_unique_keys[@]}"; do
            if [[ -z "$test_name" ]]; then continue; fi
            local pass_count=${TEST_PASS_COUNTS["$test_name"]:-0}
            local fail_count=${TEST_FAIL_COUNTS["$test_name"]:-0}
            local total_count=$((pass_count + fail_count))
            local status_color="${C_YELLOW}"
            local status_text="UNKNOWN"

            if [ "$fail_count" -gt 0 ]; then
                status_color="${C_RED}"
                status_text="FAILED"
            elif [ "$pass_count" -gt 0 ]; then
                status_color="${C_GREEN}"
                status_text="PASSED"
            fi

            printf "%-65s [%b%s%b] (Passed: %d, Failed: %d, Total: %d)\n" \
                "$test_name" \
                "$status_color" "$status_text" "$C_RESET" \
                "$pass_count" "$fail_count" "$total_count"
        done
    fi
    echo "-----------------------------------------------------"
    local overall_color="${C_GREEN}"
    if [ "$TOTAL_FAIL" -gt 0 ]; then
        overall_color="${C_RED}"
    elif [ "$TOTAL_PASS" -eq 0 ] && [ "$TOTAL_FAIL" -eq 0 ]; then
         overall_color="${C_YELLOW}"
    fi
    echo -e "${C_BOLD}Overall Results: ${overall_color}Passed: $TOTAL_PASS, Failed: $TOTAL_FAIL${C_RESET}"
    echo "-----------------------------------------------------"
    echo "Full log available at: $LOG_FILE"
}

# Trap EXIT signal to ensure summary is printed
trap print_summary EXIT


# Arrays to store driver info (only need one for token)
declare -a DRIVER_IDS
declare -a DRIVER_TOKENS
declare -a DRIVER_EMAILS

# Variable to store created billing ID
CREATED_BILLING_ID=""

# === Helper Functions ===

# Function to decode JWT Payload
decode_jwt_payload() {
    local token=$1
    local payload_base64=$(echo "$token" | cut -d '.' -f 2)
    local payload_padded=$payload_base64
    case $(( ${#payload_padded} % 4 )) in
        1) payload_padded="${payload_padded}===" ;;
        2) payload_padded="${payload_padded}==" ;;
        3) payload_padded="${payload_padded}=" ;;
    esac
    local payload_std_base64=$(echo "$payload_padded" | tr '_-' '/+')
    echo "$payload_std_base64" | base64 -d 2>/dev/null || echo "{}"
}

# Function to check status, record result, and potentially exit on failure
# Arg1: Actual status code ($?)
# Arg2: Space-separated list of expected success codes (e.g., "200 201")
# Arg3: Test Name (used for summary)
# Arg4: Failure message prefix (optional, defaults to Test Name)
# Arg5: Boolean: exit on failure? (true/false, default: true)
check_status() {
    local actual_status=$1
    local expected_codes=$2
    local test_name="$3"
    local failure_prefix="${4:-$test_name}"
    local exit_on_fail=${5:-true} # Default to exit on failure
    local success=false

    for code in $expected_codes; do
        if [ "$actual_status" -eq "$code" ]; then
            success=true
            break
        fi
    done

    if $success; then
        echo -e "${C_GREEN}Status Check PASSED${C_RESET} (Expected: ${C_YELLOW}${expected_codes}${C_RESET}, Got: ${C_GREEN}${actual_status}${C_RESET}) - [$test_name]"
        record_result "$test_name" true
    else
        local error_level="ERROR"
        if $exit_on_fail; then
            error_level="FATAL"
        fi
        echo -e "${C_RED}${C_BOLD}${error_level}: ${failure_prefix} - Expected status code(s) '${expected_codes}' but got '${actual_status}'.${C_RESET} - [$test_name]"
        record_result "$test_name" false
        if $exit_on_fail; then
            echo -e "${C_RED}${C_BOLD}Exiting script due to fatal error.${C_RESET}"
            exit 1 # Exit triggers the EXIT trap
        fi
    fi
     # Return the original status code so the caller can still use it if needed
    return "$actual_status"
}


# Function to register a driver (needed for auth token)
register_driver() {
    local i=$1
    local timestamp=$(date +%Y%m%d%H%M%S%N)
    local firstName="BillingTestF${i}"
    local lastName="BillingTestL${i}"
    local email="billingtest${i}-${timestamp}@example.com"
    local phoneNumber="555-666-${i}000${timestamp: -4}"
    local test_name="POST /auth/register/driver (For Billing Auth)"

    echo -e "${C_YELLOW}--- [Registering Driver for Auth Token] ---${C_RESET}"
    echo -e "${C_DIM}Attempting registration for: $firstName $lastName ($email)${C_RESET}"

    local response_file=$(mktemp)
    local status_code

    status_code=$(curl -s -X POST "$AUTH_BASE_URL/register/driver" \
         -H "Content-Type: application/json" \
         -d '{
                "firstName": "'"$firstName"'",
                "lastName": "'"$lastName"'",
                "email": "'"$email"'",
                "password": "'"$PASSWORD"'",
                "phoneNumber": "'"$phoneNumber"'"
             }' \
         -w "%{http_code}" \
         -o "$response_file")

    echo -e "${C_DIM}Registration Response Status: $status_code${C_RESET}"
    echo -e "${C_DIM}Registration Response Body:${C_RESET}"
    jq '.' "$response_file" || cat "$response_file" # Pretty print if JSON, else cat
    echo ""

    # check_status will exit if registration fails (default behavior)
    check_status "$status_code" "200 201" "$test_name" "Driver Registration Failed"

    local access_token=$(jq -r '.accessToken // empty' "$response_file")
    if [ -z "$access_token" ]; then
        echo -e "${C_RED}${C_BOLD}FATAL: Failed to extract accessToken after successful registration.${C_RESET}"
        record_result "$test_name" false
        rm "$response_file"
        exit 1
    fi

    local decoded_payload=$(decode_jwt_payload "$access_token")
    local driver_id=$(echo "$decoded_payload" | jq -r '.sub // empty')

    if [ -z "$driver_id" ]; then
        echo -e "${C_RED}${C_BOLD}FATAL: Failed to extract driver ID (sub) from token.${C_RESET}"
        echo -e "${C_DIM}Decoded Payload: $decoded_payload${C_RESET}"
        record_result "$test_name" false
        rm "$response_file"
        exit 1
    fi

    DRIVER_IDS[$i]="$driver_id"
    DRIVER_TOKENS[$i]="$access_token"
    DRIVER_EMAILS[$i]="$email"

    echo -e "${C_GREEN}Driver registered successfully for auth!${C_RESET}"
    echo -e "  ${C_CYAN}Driver ID:${C_RESET} ${DRIVER_IDS[$i]}"
    echo "-----------------------------"
    echo ""

    rm "$response_file"
    return 0
}

# Function to make an authenticated API call
# Returns the HTTP status code via 'echo' to stdout
# Echos the path to the temporary response file to stdout *before* returning
# The caller is responsible for reading stdout to get the file path and for removing the file
# Function to make an authenticated API call
# Returns the HTTP status code via 'echo' to stdout
# Echos the path to the temporary response file to stdout *before* returning
# The caller is responsible for reading stdout to get the file path and for removing the file
authenticated_request() {
    local method="$1"
    local url="$2"
    local token="$3"
    local data="$4" # Optional: JSON data for POST/PATCH/PUT
    local response_file=$(mktemp)
    local status_code

    # Use Authorization header directly as per billing instructions
    local curl_opts=(-s -X "$method" "$url" -H "Authorization: Bearer $token")

    # Redirect DEBUG output to stderr
    echo -e "${C_DIM}Request: $method $url${C_RESET}" >&2
    if [[ "$method" == "POST" || "$method" == "PATCH" || "$method" == "PUT" ]]; then
        curl_opts+=(-H "Content-Type: application/json")
        # Only add -d if data is not empty
        if [[ -n "$data" ]]; then
            curl_opts+=(-d "$data")
             # Redirect DEBUG output to stderr
             echo -e "${C_DIM}Data: $(echo "$data" | jq -c .)${C_RESET}" >&2
        fi
    fi

    status_code=$(curl "${curl_opts[@]}" -w "%{http_code}" -o "$response_file")

    local status_color="${C_RED}"
    if [[ "$status_code" -ge 200 && "$status_code" -lt 300 ]]; then
        status_color="${C_GREEN}"
    elif [[ "$status_code" -ge 400 && "$status_code" -lt 500 ]]; then
        status_color="${C_YELLOW}"
    fi

    # Redirect DEBUG output to stderr
    echo -e "${C_DIM}Response Status:${C_RESET} ${status_color}${status_code}${C_RESET}" >&2
    echo -e "${C_DIM}Response Body:${C_RESET}" >&2
    # Redirect DEBUG output to stderr
    (jq '.' "$response_file" || cat "$response_file") >&2
    echo "" >&2 # Also redirect the blank line

    # Echo the response file path to stdout for the caller (INTENDED CAPTURE)
    echo "$response_file"

    # Return the status code to stdout (INTENDED CAPTURE)
    echo "$status_code"
}

# === Test Execution ===

# 1. Register Driver (to get auth token)
echo -e "${C_BLUE}${C_BOLD}=== Phase 1: Registering Driver for Authentication ===${C_RESET}"
# register_driver handles exit on failure internally
if ! register_driver 1; then
    echo -e "${C_RED}${C_BOLD}Driver registration failed. Cannot proceed.${C_RESET}"
    exit 1 # Should be redundant due to check_status inside register_driver, but good practice
fi

# Use the registered driver's token for subsequent requests
TOKEN_1=${DRIVER_TOKENS[1]}
# Use the driver's ID for the billing payload's driverId field
AUTHENTICATING_DRIVER_ID=${DRIVER_IDS[1]}


echo -e "\n${C_BLUE}${C_BOLD}=== Phase 2: Testing POST /bills (Create Bill) ===${C_RESET}"
test_name="POST /bills (Create Bill)"
echo -e "${C_CYAN}Attempting to create a new bill...${C_RESET}"

# Generate some unique-ish IDs for the payload
# Note: Real implementation might require existing ride/customer IDs
timestamp_short=$(date +%s%N | cut -c 1-13) # Short timestamp for IDs
TEST_RIDE_ID=$(generate_ssn_format_id)
TEST_CUSTOMER_ID=$(generate_ssn_format_id)
# Use the ID of the driver whose token we are using
TEST_DRIVER_ID="$AUTHENTICATING_DRIVER_ID"
CURRENT_DATE=$(date +%Y-%m-%d)
PICKUP_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") # Use current time as pickup
DROPOFF_TIME=$(date -u -d "+30 minutes" +"%Y-%m-%dT%H:%M:%SZ") # 30 mins later

BILLING_DATA=$(cat <<EOF
{
  "rideId": "$TEST_RIDE_ID",
  "customerId": "$TEST_CUSTOMER_ID",
  "driverId": "$TEST_DRIVER_ID",
  "date": "$CURRENT_DATE",
  "pickupTime": "$PICKUP_TIME",
  "dropoffTime": "$DROPOFF_TIME",
  "distanceCovered": 8.5,
  "sourceLocation": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "destinationLocation": {
    "latitude": 37.3352,
    "longitude": -121.8811
  },
  "predictedAmount": 25.50,
  "actualAmount": 27.75
}
EOF
)

# Call authenticated_request and capture the response file path from stdout
response_file_post=$(authenticated_request "POST" "$BILLING_BASE_URL" "$TOKEN_1" "$BILLING_DATA")
# Capture the return status code from the function.  The status code is returned to stdout as well
status_code_post=$(tail -n 1 <<< "$response_file_post")
response_file_post=$(head -n -1 <<< "$response_file_post")

# Check the status code (Expect 201 Created)
check_status "$status_code_post" "201" "$test_name"

# If status check passed, extract the billingId
if [ "$status_code_post" -eq 201 ]; then # Check if the status code was indeed 201
    CREATED_BILLING_ID=$(jq -r '.billingId // empty' "$response_file_post")
    if [ -z "$CREATED_BILLING_ID" ]; then
        echo -e "${C_RED}${C_BOLD}FATAL: Failed to extract billingId from successful POST response.${C_RESET}"
        record_result "$test_name (Extract ID)" false # Record specific failure
        rm "$response_file_post"
        exit 1
    else
        echo -e "${C_GREEN}Successfully created bill with ID:${C_RESET} $CREATED_BILLING_ID"
        record_result "$test_name (Extract ID)" true
    fi
else
    # This branch might not be hit if check_status exits, but good for robustness
     echo -e "${C_RED}Skipping billingId extraction due to non-201 status.${C_RESET}"
     CREATED_BILLING_ID="" # Ensure it's empty
fi

# Clean up the response file
rm "$response_file_post"
echo "-----------------------------"


echo -e "\n${C_BLUE}${C_BOLD}=== Phase 3: Testing GET /bills/{billingId} (Retrieve Bill) ===${C_RESET}"
test_name="GET /bills/{id} (Retrieve Created Bill)"
if [ -z "$CREATED_BILLING_ID" ]; then
    echo -e "${C_YELLOW}Skipping Test: Cannot retrieve bill because CREATED_BILLING_ID is empty.${C_RESET}"
    record_result "$test_name" false # Mark as failed because prerequisite failed
else
    echo -e "${C_CYAN}Attempting to retrieve bill with ID: $CREATED_BILLING_ID...${C_RESET}"
    response_file_get=$(authenticated_request "GET" "$BILLING_BASE_URL/$CREATED_BILLING_ID" "$TOKEN_1")
    status_code_get=$(tail -n 1 <<< "$response_file_get")
    response_file_get=$(head -n -1 <<< "$response_file_get")
    check_status "$status_code_get" "200" "$test_name"

    # Optional: Add deeper verification (e.g., check if retrieved ID matches)
    if [ "$status_code_get" -eq 200 ]; then
        retrieved_id=$(jq -r '.billingId // empty' "$response_file_get")
        if [ "$retrieved_id" == "$CREATED_BILLING_ID" ]; then
             echo -e "${C_GREEN}Verification PASSED:${C_RESET} Retrieved billingId matches created ID."
             record_result "$test_name (Verify ID)" true
        else
             echo -e "${C_RED}Verification FAILED:${C_RESET} Retrieved billingId ('$retrieved_id') does not match created ID ('$CREATED_BILLING_ID')."
             record_result "$test_name (Verify ID)" false
             # Decide if this discrepancy should be fatal
        fi
    fi
    rm "$response_file_get"
fi
echo "-----------------------------"


echo -e "\n${C_BLUE}${C_BOLD}=== Phase 4: Testing Error Scenarios ===${C_RESET}"

# --- Test: Invalid Bill ID Format (Expect 400) ---
test_name="GET /bills/{id} (Invalid ID Format - Expect 400)"
echo -e "${C_YELLOW}--- Testing Expected Failure ---${C_RESET}"
echo -e "${C_CYAN}Attempting GET with invalid bill ID format...${C_RESET}"
response_file_err1=$(authenticated_request "GET" "$BILLING_BASE_URL/invalid-format" "$TOKEN_1")
status_code_err1=$(tail -n 1 <<< "$response_file_err1")
response_file_err1=$(head -n -1 <<< "$response_file_err1")
# Use check_status but set exit_on_fail to false for negative tests
check_status "$status_code_err1" "400" "$test_name" "Invalid ID Format Test" false
rm "$response_file_err1"
echo ""

# --- Test: Non-existent Bill ID (Expect 404) ---
test_name="GET /bills/{id} (Non-Existent ID - Expect 404)"
echo -e "${C_YELLOW}--- Testing Expected Failure ---${C_RESET}"
echo -e "${C_CYAN}Attempting GET with non-existent but valid-format bill ID...${C_RESET}"
response_file_err2=$(authenticated_request "GET" "$BILLING_BASE_URL/999-99-9999" "$TOKEN_1")
status_code_err2=$(tail -n 1 <<< "$response_file_err2")
response_file_err2=$(head -n -1 <<< "$response_file_err2")
check_status "$status_code_err2" "404" "$test_name" "Non-Existent ID Test" false
rm "$response_file_err2"
echo ""

# --- Test: Create Bill with Missing Required Fields (Expect 400) ---
test_name="POST /bills (Missing Required Fields - Expect 400)"
echo -e "${C_YELLOW}--- Testing Expected Failure ---${C_RESET}"
echo -e "${C_CYAN}Attempting POST /bills with missing required fields...${C_RESET}"
INCOMPLETE_BILLING_DATA='{ "rideId": "incomplete-ride-123" }' # Missing many fields
response_file_err3=$(authenticated_request "POST" "$BILLING_BASE_URL" "$TOKEN_1" "$INCOMPLETE_BILLING_DATA")
status_code_err3=$(tail -n 1 <<< "$response_file_err3")
response_file_err3=$(head -n -1 <<< "$response_file_err3")
check_status "$status_code_err3" "400" "$test_name" "Missing Fields Test" false
rm "$response_file_err3"
echo ""

# --- Test: Request Without Authentication (Expect 401) ---
test_name="GET /bills/{id} (No Authentication - Expect 401)"
echo -e "${C_YELLOW}--- Testing Expected Failure ---${C_RESET}"
echo -e "${C_CYAN}Attempting GET without Authorization header...${C_RESET}"
# Use a direct curl call, bypassing authenticated_request helper
target_url_noauth="$BILLING_BASE_URL/123-45-6789" # Use any plausible ID for the path
echo -e "${C_DIM}Request: GET $target_url_noauth (no auth header)${C_RESET}"
response_file_err4=$(mktemp)
status_code_err4=$(curl -s -X GET "$target_url_noauth" -w "%{http_code}" -o "$response_file_err4")
# Print response details manually for this direct call
status_color_noauth="${C_RED}"
if [ "$status_code_err4" -eq 401 ]; then status_color_noauth="${C_YELLOW}"; fi # 401 is expected failure
echo -e "${C_DIM}Response Status:${C_RESET} ${status_color_noauth}${status_code_err4}${C_RESET}"
echo -e "${C_DIM}Response Body:${C_RESET}"
jq '.' "$response_file_err4" || cat "$response_file_err4"
echo ""
# Use check_status with exit_on_fail=false
check_status "$status_code_err4" "401" "$test_name" "No Authentication Test" false
rm "$response_file_err4"
echo "-----------------------------"


echo -e "\n${C_GREEN}${C_BOLD}=== Billing Testing Complete ===${C_RESET}"

# Summary will be printed by the EXIT trap automatically.