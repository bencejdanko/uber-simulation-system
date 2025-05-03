#!/bin/bash

# === Configuration ===
KONG_PROXY_PORT=8000
AUTH_BASE_URL="http://localhost:$KONG_PROXY_PORT/api/v1/auth"
DRIVER_BASE_URL="http://localhost:$KONG_PROXY_PORT/api/v1/drivers" # Target Kong proxy
PASSWORD="StrongPassword123!"
NUM_DRIVERS_TO_REGISTER=3 # How many drivers to create for testing
LOG_FILE="test_run_$(date +%Y%m%d_%H%M%S).log" # Log file name

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
# Redirect stdout and stderr to tee, which logs to file and prints to console
# Do this *after* initial messages/checks if you don't want those logged
# Or do it early like here to log everything. 'exec' replaces the shell process.
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

    # Correct way to get unique keys while preserving spaces (requires Bash 4+)
    local -a sorted_unique_keys
    mapfile -t sorted_unique_keys < <(printf '%s\n' "${!TEST_PASS_COUNTS[@]}" "${!TEST_FAIL_COUNTS[@]}" | sort -u)

    # Alternative for older Bash (less clean):
    # declare -A unique_keys_map
    # for k in "${!TEST_PASS_COUNTS[@]}"; do unique_keys_map["$k"]=1; done
    # for k in "${!TEST_FAIL_COUNTS[@]}"; do unique_keys_map["$k"]=1; done
    # local -a sorted_unique_keys
    # mapfile -t sorted_unique_keys < <(printf '%s\n' "${!unique_keys_map[@]}" | sort)


    if [ ${#sorted_unique_keys[@]} -eq 0 ]; then
        echo -e "${C_YELLOW}No test results recorded.${C_RESET}"
    else
        for test_name in "${sorted_unique_keys[@]}"; do
            # Handle potential empty test_name if something went very wrong upstream
            if [[ -z "$test_name" ]]; then continue; fi

            local pass_count=${TEST_PASS_COUNTS["$test_name"]:-0}
            local fail_count=${TEST_FAIL_COUNTS["$test_name"]:-0}
            local total_count=$((pass_count + fail_count))
            local status_color="${C_YELLOW}" # Default to yellow if somehow counts are 0
            local status_text="UNKNOWN"

            if [ "$fail_count" -gt 0 ]; then
                status_color="${C_RED}"
                status_text="FAILED"
            elif [ "$pass_count" -gt 0 ]; then
                status_color="${C_GREEN}"
                status_text="PASSED"
            # Keep UNKNOWN/YELLOW if both pass_count and fail_count are 0 for a key that exists
            fi

            # Use printf for better formatting control
            printf "%-60s [%b%s%b] (Passed: %d, Failed: %d, Total: %d)\n" \
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
         overall_color="${C_YELLOW}" # Yellow if no tests ran or recorded results
    fi
    echo -e "${C_BOLD}Overall Results: ${overall_color}Passed: $TOTAL_PASS, Failed: $TOTAL_FAIL${C_RESET}"
    echo "-----------------------------------------------------"
    echo "Full log available at: $LOG_FILE"
}

# Trap EXIT signal to ensure summary is printed even on errors (if possible)
trap print_summary EXIT


# Arrays to store driver info
declare -a DRIVER_IDS
declare -a DRIVER_TOKENS
declare -a DRIVER_EMAILS
declare -a DRIVER_FIRST_NAMES
declare -a DRIVER_LAST_NAMES

# === Helper Functions ===

# Function to decode JWT Payload (middle part)
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

# Function to check status, record result, and exit on failure
# Arg1: Actual status code ($?)
# Arg2: Space-separated list of expected success codes (e.g., "200 201")
# Arg3: Test Name (used for summary)
# Arg4: Failure message prefix (optional, defaults to Test Name)
check_status() {
    local actual_status=$1
    local expected_codes=$2
    local test_name="$3"
    local failure_prefix="${4:-$test_name}" # Use test_name if prefix not provided
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
        echo -e "${C_RED}${C_BOLD}FATAL: ${failure_prefix} - Expected status code(s) '${expected_codes}' but got '${actual_status}'.${C_RESET} - [$test_name]"
        record_result "$test_name" false
        echo -e "${C_RED}${C_BOLD}Exiting script.${C_RESET}"
        # Summary will be printed via EXIT trap
        exit 1 # Exit triggers the EXIT trap
    fi
}


# Function to register a driver
register_driver() {
    local i=$1
    local timestamp=$(date +%Y%m%d%H%M%S%N) # Use timestamp with nanoseconds for uniqueness
    local firstName="TestDriverF${i}"
    local lastName="TestDriverL${i}"
    local email="testdriver${i}-${timestamp}@example.com" # Timestamped email
    local phoneNumber="555-555-${i}000${timestamp: -4}" # Simple unique phone with timestamp part
    local test_name="POST /auth/register/driver (Driver $i)" # Unique name per driver

    echo -e "${C_YELLOW}--- [Registering Driver $i] ---${C_RESET}"
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
    # Check if jq can parse it, otherwise just cat
    if jq '.' "$response_file" > /dev/null 2>&1; then
        cat "$response_file" | jq '.'
    else
        cat "$response_file"
    fi
    echo "" # Newline

    # Use check_status to handle success/failure and exit
    # Pass the specific test name here
    check_status "$status_code" "200 201" "$test_name" "Driver $i Registration Failed"

    # --- The rest only runs if check_status passes ---

    # Extract Access Token
    local access_token=$(jq -r '.accessToken // empty' "$response_file")
    if [ -z "$access_token" ]; then
        echo -e "${C_RED}${C_BOLD}FATAL: Failed to extract accessToken for Driver $i.${C_RESET}"
        record_result "$test_name" false # Record failure before exit if token missing after 2xx
        rm "$response_file"
        exit 1 # Exit immediately
    fi

    # Decode JWT payload to get driver ID (sub claim)
    local decoded_payload=$(decode_jwt_payload "$access_token")
    local driver_id=$(echo "$decoded_payload" | jq -r '.sub // empty')

    if [ -z "$driver_id" ]; then
        echo -e "${C_RED}${C_BOLD}FATAL: Failed to extract driver ID (sub) from token for Driver $i.${C_RESET}"
        echo -e "${C_DIM}Decoded Payload: $decoded_payload${C_RESET}"
        record_result "$test_name" false # Record failure before exit if ID missing after 2xx
        rm "$response_file"
        exit 1 # Exit immediately
    fi

    # Store driver info
    DRIVER_IDS[$i]="$driver_id"
    DRIVER_TOKENS[$i]="$access_token"
    DRIVER_EMAILS[$i]="$email"
    DRIVER_FIRST_NAMES[$i]="$firstName"
    DRIVER_LAST_NAMES[$i]="$lastName"

    echo -e "${C_GREEN}Driver $i registered successfully!${C_RESET}"
    echo -e "  ${C_CYAN}Driver ID:${C_RESET} ${DRIVER_IDS[$i]}"
    echo -e "  ${C_CYAN}Email:${C_RESET} ${DRIVER_EMAILS[$i]}"
    # echo "  Token: ${DRIVER_TOKENS[$i]}" # Keep token uncommented only for debug
    echo "-----------------------------"
    echo ""

    rm "$response_file"
    return 0 # Return 0 explicitly on success
}

# Function to make an authenticated API call
# Does NOT record results, the caller should do that via check_status or manually
authenticated_request() {
    local method="$1"
    local url="$2"
    local token="$3"
    local data="$4"
    local response_file=$(mktemp)
    local status_code
    local curl_opts=(-s -X "$method" "$url" -H "Authorization: Bearer $token")

    echo -e "${C_DIM}Request: $method $url${C_RESET}"
    if [[ "$method" == "POST" || "$method" == "PATCH" || "$method" == "PUT" ]]; then
        curl_opts+=(-H "Content-Type: application/json" -d "$data")
        echo -e "${C_DIM}Data: $data${C_RESET}"
    fi

    status_code=$(curl "${curl_opts[@]}" -w "%{http_code}" -o "$response_file")

    # Color code status based on range
    local status_color="${C_RED}"
    if [[ "$status_code" -ge 200 && "$status_code" -lt 300 ]]; then
        status_color="${C_GREEN}"
    elif [[ "$status_code" -ge 400 && "$status_code" -lt 500 ]]; then
        status_color="${C_YELLOW}"
    fi

    echo -e "${C_DIM}Response Status:${C_RESET} ${status_color}${status_code}${C_RESET}"
    echo -e "${C_DIM}Response Body:${C_RESET}"
    # Check if jq can parse it, otherwise just cat
    if jq '.' "$response_file" > /dev/null 2>&1; then
        cat "$response_file" | jq '.'
    else
        cat "$response_file"
    fi
    echo "" # Newline

    # Store response body in a global variable for potential checks? Or pass file back?
    # For simplicity, just return status code. Caller can re-run if needed for validation.
    # Alternatively, echo "$response_file" before returning status, and caller `reads` it.
    # Current approach: just return status.

    rm "$response_file"
    return "$status_code" # Return status code for checks
}

# === Test Execution ===

# 1. Register Multiple Drivers
echo -e "${C_BLUE}${C_BOLD}=== Phase 1: Registering $NUM_DRIVERS_TO_REGISTER Drivers ===${C_RESET}"
registration_successful=false
for i in $(seq 1 $NUM_DRIVERS_TO_REGISTER); do
    # register_driver now handles exit on failure internally via check_status
    if register_driver "$i"; then
        registration_successful=true # Mark that at least one succeeded
    else
        # This else block might not be reached if register_driver exits,
        # but kept for clarity. The EXIT trap handles summary.
        echo -e "${C_RED}${C_BOLD}Halting script due to registration failure in loop.${C_RESET}"
        exit 1
    fi
    sleep 0.5 # Small delay between registrations if needed
done

# This check might be redundant if register_driver exits, but good failsafe
if ! $registration_successful; then
    echo -e "${C_RED}${C_BOLD}No drivers were successfully registered. Cannot proceed.${C_RESET}"
    exit 1
fi

# Use the first registered driver for most individual tests
DRIVER_ID_1=${DRIVER_IDS[1]}
TOKEN_1=${DRIVER_TOKENS[1]}
EMAIL_1=${DRIVER_EMAILS[1]}
FIRST_NAME_1=${DRIVER_FIRST_NAMES[1]}
LAST_NAME_1=${DRIVER_LAST_NAMES[1]}


echo -e "\n${C_BLUE}${C_BOLD}=== Phase 2: Testing GET /drivers/{driver_id} (Initial) ===${C_RESET}"
test_name="GET /drivers/{id} (Initial)"
echo -e "${C_CYAN}Attempting to GET profile for Driver 1 (ID: $DRIVER_ID_1)...${C_RESET}"
authenticated_request "GET" "$DRIVER_BASE_URL/$DRIVER_ID_1" "$TOKEN_1"
check_status $? "200" "$test_name"
echo "-----------------------------"


echo -e "\n${C_BLUE}${C_BOLD}=== Phase 3: Testing PATCH /drivers/{driver_id} (Profile Completion) ===${C_RESET}"
test_name="PATCH /drivers/{id} (Profile Update)"
echo -e "${C_CYAN}Attempting to PATCH Driver 1 (ID: $DRIVER_ID_1) to add Address and Car Details...${C_RESET}"
PATCH_DATA_1=$(cat <<EOF
{
  "address": {
    "street": "123 Main St",
    "city": "San Jose",
    "state": "CA",
    "zipCode": "95123"
  },
  "carDetails": {
    "make": "Toyota",
    "model": "Camry",
    "year": 2022,
    "color": "Silver",
    "licensePlate": "TEST1${DRIVER_ID_1: -4}"
  },
  "introduction": {
      "imageUrl": "http://example.com/driver1_image.jpg"
  }
}
EOF
)
authenticated_request "PATCH" "$DRIVER_BASE_URL/$DRIVER_ID_1" "$TOKEN_1" "$PATCH_DATA_1"
check_status $? "200" "$test_name"
echo "-----------------------------"


echo -e "\n${C_BLUE}${C_BOLD}=== Phase 4: Testing GET /drivers/{driver_id} (After Update) ===${C_RESET}"
test_name="GET /drivers/{id} (After Update)"
echo -e "${C_CYAN}Attempting to GET profile for Driver 1 (ID: $DRIVER_ID_1) again to verify PATCH...${C_RESET}"
authenticated_request "GET" "$DRIVER_BASE_URL/$DRIVER_ID_1" "$TOKEN_1"
check_status $? "200" "$test_name"
echo "-----------------------------"


echo -e "\n${C_BLUE}${C_BOLD}=== Phase 5: Testing PATCH /drivers/{driver_id}/location ===${C_RESET}"
test_name="PATCH /drivers/{id}/location"
echo -e "${C_CYAN}Attempting to update location for Driver 1 (ID: $DRIVER_ID_1)...${C_RESET}"
LOCATION_DATA_1='{
  "latitude": 37.3387,
  "longitude": -121.8853
}'
authenticated_request "PATCH" "$DRIVER_BASE_URL/$DRIVER_ID_1/location" "$TOKEN_1" "$LOCATION_DATA_1"
check_status $? "200 204" "$test_name" # Allow 200 OK or 204 No Content
echo "-----------------------------"


echo -e "\n${C_BLUE}${C_BOLD}=== Phase 6: Testing GET /drivers/{driver_id} (After Location Update) ===${C_RESET}"
test_name="GET /drivers/{id} (After Location Update)"
echo -e "${C_CYAN}Attempting to GET profile for Driver 1 (ID: $DRIVER_ID_1) again to verify location update...${C_RESET}"
authenticated_request "GET" "$DRIVER_BASE_URL/$DRIVER_ID_1" "$TOKEN_1"
check_status $? "200" "$test_name"
echo "-----------------------------"

# Update Driver 2's location as well for nearby testing
if [ ${#DRIVER_IDS[@]} -ge 2 ]; then
    DRIVER_ID_2=${DRIVER_IDS[2]}
    TOKEN_2=${DRIVER_TOKENS[2]}
    test_name_loc2="PATCH /drivers/{id}/location (Driver 2)"
    echo -e "${C_CYAN}Attempting to update location for Driver 2 (ID: $DRIVER_ID_2)...${C_RESET}"
    LOCATION_DATA_2='{ "latitude": 37.3400, "longitude": -121.8900 }'
    authenticated_request "PATCH" "$DRIVER_BASE_URL/$DRIVER_ID_2/location" "$TOKEN_2" "$LOCATION_DATA_2"
    check_status $? "200 204" "$test_name_loc2"
    echo "-----------------------------"
    echo ""
fi


echo -e "\n${C_BLUE}${C_BOLD}=== Phase 7: Testing GET /drivers (List/Search Filters) ===${C_RESET}"
test_name="GET /drivers (No Filter)"
echo -e "${C_CYAN}Attempting GET /drivers (no filters)...${C_RESET}"
authenticated_request "GET" "$DRIVER_BASE_URL" "$TOKEN_1"
check_status $? "200" "$test_name"

test_name="GET /drivers?limit=1"
echo -e "\n${C_CYAN}Attempting GET /drivers?limit=1...${C_RESET}"
authenticated_request "GET" "$DRIVER_BASE_URL?limit=1" "$TOKEN_1"
check_status $? "200" "$test_name"

test_name="GET /drivers?city=San Jose"
echo -e "\n${C_CYAN}Attempting GET /drivers?city=San Jose...${C_RESET}"
authenticated_request "GET" "$DRIVER_BASE_URL?city=San%20Jose" "$TOKEN_1" # URL encode space
check_status $? "200" "$test_name"

test_name="GET /drivers?state=CA"
echo -e "\n${C_CYAN}Attempting GET /drivers?state=CA...${C_RESET}"
authenticated_request "GET" "$DRIVER_BASE_URL?state=CA" "$TOKEN_1"
check_status $? "200" "$test_name"

test_name="GET /drivers?car_make=Toyota"
echo -e "\n${C_CYAN}Attempting GET /drivers?car_make=Toyota...${C_RESET}"
authenticated_request "GET" "$DRIVER_BASE_URL?car_make=Toyota" "$TOKEN_1"
check_status $? "200" "$test_name"

test_name="GET /drivers?min_rating=4.0"
echo -e "\n${C_CYAN}Attempting GET /drivers?min_rating=4.0...${C_RESET}"
authenticated_request "GET" "$DRIVER_BASE_URL?min_rating=4.0" "$TOKEN_1"
check_status $? "200" "$test_name"
echo "-----------------------------"


echo -e "\n${C_BLUE}${C_BOLD}=== Phase 8: Testing GET /drivers/search (By Name) ===${C_RESET}"
test_name="GET /drivers/search (First Name: $FIRST_NAME_1)"
echo -e "${C_CYAN}Attempting GET /drivers/search?name=$FIRST_NAME_1...${C_RESET}"
authenticated_request "GET" "$DRIVER_BASE_URL/search?name=$FIRST_NAME_1" "$TOKEN_1"
check_status $? "200" "$test_name"

test_name="GET /drivers/search (Partial Last Name: TestDriverL)"
echo -e "\n${C_CYAN}Attempting GET /drivers/search?name=TestDriverL...${C_RESET}" # Partial last name
authenticated_request "GET" "$DRIVER_BASE_URL/search?name=TestDriverL" "$TOKEN_1"
check_status $? "200" "$test_name"
echo "-----------------------------"


echo -e "\n${C_BLUE}${C_BOLD}=== Phase 9: Testing GET /drivers/nearby ===${C_RESET}"
test_name="GET /drivers/nearby (Valid Params)"
echo -e "${C_CYAN}Attempting GET /drivers/nearby?latitude=37.3390&longitude=-121.8860&radius=5000 (in meters)...${C_RESET}"
authenticated_request "GET" "$DRIVER_BASE_URL/nearby?latitude=37.3390&longitude=-121.8860&radius=5000" "$TOKEN_1"
check_status $? "200" "$test_name"

# --- Negative Test for Nearby ---
test_name="GET /drivers/nearby (Missing Params - Expect 400)"
echo -e "\n${C_YELLOW}--- Testing Expected Failure ---${C_RESET}"
echo -e "${C_CYAN}Attempting GET /drivers/nearby (missing params)...${C_RESET}"
authenticated_request "GET" "$DRIVER_BASE_URL/nearby" "$TOKEN_1"
actual_status=$?
expected_status=400
if [ "$actual_status" -eq $expected_status ]; then
    echo -e "${C_GREEN}Status Check PASSED${C_RESET} (Expected: ${C_YELLOW}${expected_status}${C_RESET}, Got: ${C_GREEN}${actual_status}${C_RESET}) - [$test_name]"
    record_result "$test_name" true
else
    echo -e "${C_RED}Status Check FAILED${C_RESET} (Expected: ${C_YELLOW}${expected_status}${C_RESET}, Got: ${C_RED}${actual_status}${C_RESET}) - [$test_name] - ${C_YELLOW}Continuing anyway for negative tests.${C_RESET}"
    record_result "$test_name" false
    # Decide if this specific failure should halt the script or not. Here we continue.
fi
echo "-----------------------------"


echo -e "\n${C_BLUE}${C_BOLD}=== Phase 10: Testing Negative Cases (Expected Errors) ===${C_RESET}"

# --- Negative Test for GET Non-existent ID ---
test_name="GET /drivers/{id} (Non-Existent ID - Expect 404)"
echo -e "${C_YELLOW}--- Testing Expected Failure ---${C_RESET}"
echo -e "${C_CYAN}Attempting GET with non-existent driver ID...${C_RESET}"
authenticated_request "GET" "$DRIVER_BASE_URL/00000000-0000-0000-0000-000000000000" "$TOKEN_1" # Use a valid UUID format likely to not exist
actual_status=$?
expected_status=404
if [ "$actual_status" -eq $expected_status ]; then
    echo -e "${C_GREEN}Status Check PASSED${C_RESET} (Expected: ${C_YELLOW}${expected_status}${C_RESET}, Got: ${C_GREEN}${actual_status}${C_RESET}) - [$test_name]"
    record_result "$test_name" true
else
    echo -e "${C_RED}Status Check FAILED${C_RESET} (Expected: ${C_YELLOW}${expected_status}${C_RESET}, Got: ${C_RED}${actual_status}${C_RESET}) - [$test_name] - ${C_YELLOW}Continuing anyway.${C_RESET}"
    record_result "$test_name" false
fi

# --- Negative Test for GET Invalid ID Format ---
test_name="GET /drivers/{id} (Invalid ID Format - Expect 400)"
echo -e "\n${C_YELLOW}--- Testing Expected Failure ---${C_RESET}"
echo -e "${C_CYAN}Attempting GET with invalid driver ID format...${C_RESET}"
authenticated_request "GET" "$DRIVER_BASE_URL/invalid-id-format" "$TOKEN_1"
actual_status=$?
expected_status=400
if [ "$actual_status" -eq $expected_status ]; then
    echo -e "${C_GREEN}Status Check PASSED${C_RESET} (Expected: ${C_YELLOW}${expected_status}${C_RESET}, Got: ${C_GREEN}${actual_status}${C_RESET}) - [$test_name]"
    record_result "$test_name" true
else
    echo -e "${C_RED}Status Check FAILED${C_RESET} (Expected: ${C_YELLOW}${expected_status}${C_RESET}, Got: ${C_RED}${actual_status}${C_RESET}) - [$test_name] - ${C_YELLOW}Continuing anyway.${C_RESET}"
    record_result "$test_name" false
fi

# --- Negative Test for PATCH Invalid Data ---
test_name="PATCH /drivers/{id} (Invalid Data - Expect 400)"
echo -e "\n${C_YELLOW}--- Testing Expected Failure ---${C_RESET}"
echo -e "${C_CYAN}Attempting PATCH with invalid data (e.g., bad zip code)...${C_RESET}"
INVALID_PATCH_DATA='{ "address": { "zipCode": "abcde" } }'
authenticated_request "PATCH" "$DRIVER_BASE_URL/$DRIVER_ID_1" "$TOKEN_1" "$INVALID_PATCH_DATA"
actual_status=$?
expected_status=400
if [ "$actual_status" -eq $expected_status ]; then
     echo -e "${C_GREEN}Status Check PASSED${C_RESET} (Expected: ${C_YELLOW}${expected_status}${C_RESET}, Got: ${C_GREEN}${actual_status}${C_RESET}) - [$test_name]"
     record_result "$test_name" true
else
    echo -e "${C_RED}Status Check FAILED${C_RESET} (Expected: ${C_YELLOW}${expected_status}${C_RESET}, Got: ${C_RED}${actual_status}${C_RESET}) - [$test_name] - ${C_YELLOW}Continuing anyway.${C_RESET}"
    record_result "$test_name" false
fi
echo "-----------------------------"


echo -e "\n${C_BLUE}${C_BOLD}=== Phase 11: Testing DELETE /drivers/{driver_id} ===${C_RESET}"
# Delete the last registered driver if available
if [ ${#DRIVER_IDS[@]} -ge 2 ]; then
    DELETE_INDEX=${#DRIVER_IDS[@]} # Get the last index (bash arrays are 0-based, but seq starts at 1, so this works)
    DRIVER_ID_TO_DELETE=${DRIVER_IDS[$DELETE_INDEX]}
    TOKEN_TO_DELETE=${DRIVER_TOKENS[$DELETE_INDEX]}

    test_name_delete="DELETE /drivers/{id}"
    echo -e "${C_CYAN}Attempting to DELETE Driver $DELETE_INDEX (ID: $DRIVER_ID_TO_DELETE)...${C_RESET}"
    authenticated_request "DELETE" "$DRIVER_BASE_URL/$DRIVER_ID_TO_DELETE" "$TOKEN_TO_DELETE"
    check_status $? "204" "$test_name_delete" # Expect 204 No Content

    # --- Test GET after DELETE (Expect 404) ---
    test_name_get_deleted="GET /drivers/{id} (After DELETE - Expect 404)"
    echo -e "\n${C_CYAN}Attempting to GET the deleted driver (ID: $DRIVER_ID_TO_DELETE) - expecting 404...${C_RESET}"
    authenticated_request "GET" "$DRIVER_BASE_URL/$DRIVER_ID_TO_DELETE" "$TOKEN_1" # Use any valid token
    actual_status=$?
    expected_status=404
    if [ "$actual_status" -eq $expected_status ]; then
        echo -e "${C_GREEN}Status Check PASSED${C_RESET} (Expected: ${C_YELLOW}${expected_status}${C_RESET}, Got: ${C_GREEN}${actual_status}${C_RESET}) - [$test_name_get_deleted]"
        record_result "$test_name_get_deleted" true
    else
        # This IS a failure of the test logic if the deleted user is still found or another error occurs
        echo -e "${C_RED}${C_BOLD}FATAL: GET after DELETE - Expected status code '${expected_status}' but got '${actual_status}'.${C_RESET} - [$test_name_get_deleted]"
        record_result "$test_name_get_deleted" false
        echo -e "${C_RED}${C_BOLD}Exiting script.${C_RESET}"
        exit 1 # This is a critical test failure
    fi
else
    echo -e "${C_YELLOW}Skipping DELETE test as less than 2 drivers were registered.${C_RESET}"
fi
echo "-----------------------------"


echo -e "\n${C_GREEN}${C_BOLD}=== Testing Complete ===${C_RESET}"

# Summary will be printed by the EXIT trap automatically here, or when exit 1 is called.
# No need for an explicit 'exit 0' if the script reaches the end without errors.
# The EXIT trap ensures print_summary runs regardless.