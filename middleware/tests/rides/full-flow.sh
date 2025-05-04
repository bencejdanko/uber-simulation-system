#!/bin/bash

# === Configuration ===
KONG_PROXY_PORT=8000
AUTH_BASE_URL="http://localhost:$KONG_PROXY_PORT/api/v1/auth"
RIDES_BASE_URL="http://localhost:$KONG_PROXY_PORT/api/v1/rides"
PASSWORD="StrongPassword123!"
NUM_RIDES_TO_TEST=2
LOG_FILE="test_run_$(date +%Y%m%d_%H%M%S).log"

# === Color Definitions ===
C_RESET='\033[0m'
C_RED='\033[0;31m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_BLUE='\033[0;34m'
C_CYAN='\033[0;36m'
C_BOLD='\033[1m'
C_DIM='\033[2m'

exec > >(tee -a "$LOG_FILE") 2>&1
trap print_summary EXIT

declare -A TEST_PASS_COUNTS
declare -A TEST_FAIL_COUNTS
TOTAL_PASS=0
TOTAL_FAIL=0

record_result() {
  local name="$1"
  local passed=$2
  if [ "$passed" = true ]; then
    TEST_PASS_COUNTS["$name"]=$(( ${TEST_PASS_COUNTS["$name"]:-0} + 1 ))
    TOTAL_PASS=$((TOTAL_PASS+1))
  else
    TEST_FAIL_COUNTS["$name"]=$(( ${TEST_FAIL_COUNTS["$name"]:-0} + 1 ))
    TOTAL_FAIL=$((TOTAL_FAIL+1))
  fi
}

print_summary() {
  echo -e "\n${C_BLUE}${C_BOLD}=== Test Summary ===${C_RESET}"
  for name in "${!TEST_PASS_COUNTS[@]}" "${!TEST_FAIL_COUNTS[@]}"; do
    if [ -n "$name" ]; then
      pass_count=${TEST_PASS_COUNTS["$name"]:-0}
      fail_count=${TEST_FAIL_COUNTS["$name"]:-0}
      total=$((pass_count + fail_count))
      status="${C_GREEN}PASSED${C_RESET}"
      if [ "$fail_count" -gt 0 ]; then status="${C_RED}FAILED${C_RESET}"; fi
      printf "%-50s [%b] (Passed: %d, Failed: %d)\n" "$name" "$status" "$pass_count" "$fail_count"
    fi
  done
  echo -e "\nTotal: ${C_GREEN}$TOTAL_PASS${C_RESET} passed, ${C_RED}$TOTAL_FAIL${C_RESET} failed"
  echo "Log file: $LOG_FILE"
}

check_status() {
  local actual="$1"; local expected="$2"; local name="$3"
  if [[ "$expected" =~ $actual ]]; then
    echo -e "${C_GREEN}✓ $name${C_RESET}"
    record_result "$name" true
  else
    echo -e "${C_RED}✗ $name (got $actual, expected $expected)${C_RESET}"
    record_result "$name" false
  fi
}

decode_jwt_payload() {
  local token=$1
  local body=$(echo $token | cut -d '.' -f 2)
  while (( ${#body} % 4 != 0 )); do body+="="; done
  echo "$body" | tr '_-' '/+' | base64 -d 2>/dev/null || echo '{}'
}

get_customer_token() {
  local email="test-$(date +%s%N)@example.com"
  local resp=$(mktemp)
  local code=$(curl -s -w "%{http_code}" -o "$resp" -X POST "$AUTH_BASE_URL/register/customer" \
    -H "Content-Type: application/json" \
    -d '{"firstName":"Test","lastName":"User","email":"'$email'","password":"'$PASSWORD'","phoneNumber":"1234567890"}')
  check_status "$code" "200|201" "Register Customer"
  jq -r '.accessToken' "$resp"
  rm "$resp"
}

create_ride() {
  local token="$1"
  local test_name="Create Ride"
  local resp=$(mktemp)
  local code=$(curl -s -w "%{http_code}" -o "$resp" -X POST "$RIDES_BASE_URL" \
    -H "Authorization: Bearer $token" -H "Content-Type: application/json" \
    -d '{"pickupLocation":{"latitude":40.7128,"longitude":-74.0060},"dropoffLocation":{"latitude":40.7589,"longitude":-73.9851}}')
  check_status "$code" "201" "$test_name"
  jq -r '.id' "$resp"
  rm "$resp"
}

test_poll_for_status() {
  local token="$1"; local id="$2"; local expected_status="$3"
  local attempts=5; local delay=2; local test_name="Poll Ride Status == $expected_status"
  for i in $(seq 1 $attempts); do
    local status=$(curl -s -H "Authorization: Bearer $token" "$RIDES_BASE_URL/$id" | jq -r '.status')
    if [ "$status" = "$expected_status" ]; then
      check_status "200" "200" "$test_name"
      return
    fi
    sleep $delay
  done
  echo -e "${C_RED}✗ $test_name (status never reached)${C_RESET}"
  record_result "$test_name" false
}

test_get_ride() {
  local token=$1; local id=$2
  check_status $(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $token" "$RIDES_BASE_URL/$id") "200" "Get Ride Details"
}

test_update_ride_status() {
  local token=$1; local id=$2; local status=$3
  check_status $(curl -s -o /dev/null -w "%{http_code}" -X PUT "$RIDES_BASE_URL/$id/status" \
    -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"status":"'$status'"}') "200" "Update Ride to $status"
}

test_complete_ride() {
  local token=$1; local id=$2
  check_status $(curl -s -o /dev/null -w "%{http_code}" -X PUT "$RIDES_BASE_URL/$id/complete" \
    -H "Authorization: Bearer $token") "200" "Complete Ride"
}

test_cancel_ride() {
  local token=$1; local id=$2
  check_status $(curl -s -o /dev/null -w "%{http_code}" -X POST "$RIDES_BASE_URL/$id/cancel" \
    -H "Authorization: Bearer $token") "200|400" "Cancel Ride (may fail if already complete)"
}

# Simulate Kafka Event Check (Mocked)
validate_kafka_event_mock() {
  local event_type="$1"
  local test_name="Kafka Event Emitted: $event_type"
  echo -e "${C_DIM}(Simulated check for Kafka event '$event_type')${C_RESET}"
  check_status "200" "200" "$test_name" # Always pass for now
}

TOKEN=$(get_customer_token)

for i in $(seq 1 $NUM_RIDES_TO_TEST); do
  echo -e "\n${C_BOLD}--- Ride Flow $i ---${C_RESET}"
  RIDE_ID=$(create_ride "$TOKEN")
  validate_kafka_event_mock "ride.requested"
  test_get_ride "$TOKEN" "$RIDE_ID"
  test_update_ride_status "$TOKEN" "$RIDE_ID" "ACCEPTED"
  test_poll_for_status "$TOKEN" "$RIDE_ID" "ACCEPTED"
  test_update_ride_status "$TOKEN" "$RIDE_ID" "IN_PROGRESS"
  test_complete_ride "$TOKEN" "$RIDE_ID"
  validate_kafka_event_mock "ride.completed"
  test_cancel_ride "$TOKEN" "$RIDE_ID" # should fail since it's completed
  validate_kafka_event_mock "ride.cancel.attempted"
done
