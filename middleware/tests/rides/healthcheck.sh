#!/bin/bash

# === Configuration ===
KONG_PROXY_PORT=8000
BASE_URL="http://host.docker.internal:$KONG_PROXY_PORT/api/v1"
AUTH_URL="$BASE_URL/auth"
RIDES_URL="$BASE_URL/rides"
PASSWORD="StrongPassword123!"

# === Color Codes ===
C_RESET='\033[0m'
C_GREEN='\033[0;32m'
C_RED='\033[0;31m'
C_YELLOW='\033[0;33m'

# === Register a test customer ===
email="healthcheck-$(date +%s%N)@example.com"
echo -e "${C_YELLOW}Registering test customer...${C_RESET}"
response=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/register/customer" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Health",
    "lastName": "Check",
    "email": "'"$email"'",
    "password": "'"$PASSWORD"'",
    "phoneNumber": "1234567890"
  }')

status_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | sed '$d')

if [[ "$status_code" == "200" || "$status_code" == "201" ]]; then
  echo -e "${C_GREEN}✓ Registration successful${C_RESET}"
  token=$(echo "$response_body" | jq -r '.accessToken')
else
  echo -e "${C_RED}✗ Registration failed (status $status_code)${C_RESET}"
  echo "$response_body"
  exit 1
fi

# === Call Rides Health Check (if available) ===
echo -e "${C_YELLOW}Checking /rides (GET)...${C_RESET}"
rides_response=$(curl -s -w "\n%{http_code}" -X GET "$RIDES_URL" \
  -H "Authorization: Bearer $token")

rides_status=$(echo "$rides_response" | tail -n1)
rides_body=$(echo "$rides_response" | sed '$d')

if [[ "$rides_status" == "200" ]]; then
  echo -e "${C_GREEN}✓ Rides endpoint reachable${C_RESET}"
  echo "$rides_body" | jq '.'
else
  echo -e "${C_RED}✗ Rides endpoint failed (status $rides_status)${C_RESET}"
  echo "$rides_body" | jq '.'
  exit 1
fi
