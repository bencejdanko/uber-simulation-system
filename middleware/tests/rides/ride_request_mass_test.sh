#!/bin/bash

# === Configuration ===
KONG_PROXY_PORT=8000 # Adjust if your Kong proxy runs on a different port
AUTH_BASE_URL="http://localhost:$KONG_PROXY_PORT/api/v1/auth"
RIDES_BASE_URL="http://localhost:$KONG_PROXY_PORT/api/v1/rides" # Target Kong proxy for rides service
PASSWORD="StrongPassword123!" # Use a known password for registration
NUM_CUSTOMERS_TO_REGISTER=5 # Number of customers to register and request rides for
NUM_REQUESTS_PER_CUSTOMER=3 # Number of ride requests each customer will make
LOG_FILE="ride_request_test_run_$(date +%Y%m%d_%H%M%S).log" # Log file name

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

# Function to generate random coordinates within a plausible range (e.g., SF Bay Area)
generate_random_coords() {
    local lat_min=37.0
    local lat_max=38.0
    local lon_min=-123.0
    local lon_max=-121.5

    local lat=$(echo "$lat_min + ($lat_max - $lat_min) * $RANDOM / 32767" | bc -l)
    local lon=$(echo "$lon_min + ($lon_max - $lon_min) * $RANDOM / 32767" | bc -l)

    echo "$lat $lon" # Return space-separated lat lon
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
if ! command -v bc &> /dev/null; then
    echo -e "${C_RED}${C_BOLD}Error: 'bc' command not found. Please install bc.${C_RESET}"
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


# Arrays to store customer info
declare -a CUSTOMER_IDS
declare -a CUSTOMER_TOKENS
declare -a CUSTOMER_EMAILS

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


# Function to register a customer
register_customer() {
    local i=$1
    local timestamp=$(date +%Y%m%d%H%M%S%N)
    local firstName="RideTestCustF${i}"
    local lastName="RideTestCustL${i}"
    local email="ridetestcust${i}-${timestamp}@example.com"
    local phoneNumber="555-777-${i}000${timestamp: -4}"
    local test_name="POST /auth/register/customer (Customer $i)"

    echo -e "${C_YELLOW}--- [Registering Customer $i] ---${C_RESET}"
    echo -e "${C_DIM}Attempting registration for: $firstName $lastName ($email)${C_RESET}"

    local response_file=$(mktemp)
    local status_code

    status_code=$(curl -s -X POST "$AUTH_BASE_URL/register/customer" \
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
    check_status "$status_code" "200 201" "$test_name" "Customer Registration Failed"

    local access_token=$(jq -r '.accessToken // empty' "$response_file")
    if [ -z "$access_token" ]; then
        echo -e "${C_RED}${C_BOLD}FATAL: Failed to extract accessToken after successful registration for customer $i.${C_RESET}"
        record_result "$test_name" false
        rm "$response_file"
        exit 1
    fi

    local decoded_payload=$(decode_jwt_payload "$access_token")
    local customer_id=$(echo "$decoded_payload" | jq -r '.sub // empty')

    if [ -z "$customer_id" ]; then
        echo -e "${C_RED}${C_BOLD}FATAL: Failed to extract customer ID (sub) from token for customer $i.${C_RESET}"
        echo -e "${C_DIM}Decoded Payload: $decoded_payload${C_RESET}"
        record_result "$test_name" false
        rm "$response_file"
        exit 1
    fi

    CUSTOMER_IDS[$i]="$customer_id"
    CUSTOMER_TOKENS[$i]="$access_token"
    CUSTOMER_EMAILS[$i]="$email"

    echo -e "${C_GREEN}Customer $i registered successfully!${C_RESET}"
    echo -e "  ${C_CYAN}Customer ID:${C_RESET} ${CUSTOMER_IDS[$i]}"
    echo "-----------------------------"
    echo ""

    rm "$response_file"
    return 0
}

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

    # Use Authorization header directly
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

# 1. Register Customers
echo -e "${C_BLUE}${C_BOLD}=== Phase 1: Registering $NUM_CUSTOMERS_TO_REGISTER Customers ===${C_RESET}"
for (( i=1; i<=NUM_CUSTOMERS_TO_REGISTER; i++ )); do
    # register_customer handles exit on failure internally
    if ! register_customer $i; then
        echo -e "${C_RED}${C_BOLD}Customer registration failed for customer $i. Cannot proceed.${C_RESET}"
        exit 1 # Should be redundant, but good practice
    fi
done
echo -e "${C_GREEN}${C_BOLD}All customers registered successfully.${C_RESET}"


echo -e "\n${C_BLUE}${C_BOLD}=== Phase 2: Requesting Rides ===${C_RESET}"
for (( cust_idx=1; cust_idx<=NUM_CUSTOMERS_TO_REGISTER; cust_idx++ )); do
    CUSTOMER_ID=${CUSTOMER_IDS[$cust_idx]}
    CUSTOMER_TOKEN=${CUSTOMER_TOKENS[$cust_idx]}
    CUSTOMER_EMAIL=${CUSTOMER_EMAILS[$cust_idx]}

    echo -e "${C_CYAN}--- Requesting $NUM_REQUESTS_PER_CUSTOMER rides for Customer $cust_idx ($CUSTOMER_EMAIL) ---${C_RESET}"

    for (( req_idx=1; req_idx<=NUM_REQUESTS_PER_CUSTOMER; req_idx++ )); do
        test_name="POST /rides (Customer $cust_idx, Request $req_idx)"
        echo -e "${C_DIM}Attempting ride request $req_idx for customer $cust_idx...${C_RESET}"

        # Generate random pickup and destination coordinates
        read pickup_lat pickup_lon < <(generate_random_coords)
        read dest_lat dest_lon < <(generate_random_coords)

        RIDE_REQUEST_DATA=$(cat <<EOF
{
  "pickupLocation": {
    "latitude": $pickup_lat,
    "longitude": $pickup_lon
  },
  "dropoffLocation": {
    "latitude": $dest_lat,
    "longitude": $dest_lon
  },
  "vehicleType": "STANDARD",
  "paymentMethod": "CREDIT_CARD"
}
EOF
)

        # Call authenticated_request and capture the response file path and status code
        response_file_post=$(authenticated_request "POST" "$RIDES_BASE_URL" "$CUSTOMER_TOKEN" "$RIDE_REQUEST_DATA") # Removed trailing slash
        status_code_post=$(tail -n 1 <<< "$response_file_post")
        response_file_post=$(head -n -1 <<< "$response_file_post")

        # Check the status code (Expect 201 Created or potentially 200 OK depending on API design)
        # Adjust "201" if your API returns a different success code (e.g., "200")
        check_status "$status_code_post" "201 200" "$test_name"

        # Optional: Extract ride ID if needed for further tests
        if [[ "$status_code_post" -eq 201 || "$status_code_post" -eq 200 ]]; then
            created_ride_id=$(jq -r '.rideId // .id // empty' "$response_file_post") # Check common ID fields
            if [ -n "$created_ride_id" ]; then
                echo -e "${C_GREEN}Successfully requested ride with ID:${C_RESET} $created_ride_id"
                record_result "$test_name (Extract ID)" true
            else
                echo -e "${C_YELLOW}Warning: Ride request successful (status $status_code_post) but failed to extract ride ID from response.${C_RESET}"
                record_result "$test_name (Extract ID)" false
            fi
        fi

        # Clean up the response file
        rm "$response_file_post"
        echo "---"
        # Optional: Add a small delay between requests if needed
        # sleep 0.1
    done
    echo "-----------------------------"
done


echo -e "\n${C_GREEN}${C_BOLD}=== Ride Request Testing Complete ===${C_RESET}"

# Summary will be printed by the EXIT trap automatically.
