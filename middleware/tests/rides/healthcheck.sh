#!/bin/bash

# --- HEALTH CHECK TEST via KONG ---

# Variables
KONG_PROXY_PORT=8000 # Port mapped in docker-compose for Kong's proxy
BASE_URL="http://localhost:$KONG_PROXY_PORT/api/v1/rides" # Target Kong now
# Use the ACCESS_TOKEN from a successful login

ACCESS_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF1dGgtc2VydmljZS1rZXktMSJ9.eyJzdWIiOiJlZjA3NTJjYS1mMjlhLTQzYTgtOTIyNS00M2NmNzFlZmY4MmIiLCJyb2xlcyI6WyJEUklWRVIiXSwiaXNzIjoiaHR0cHM6Ly9teS1hdXRoLXNlcnZpY2UuY29tIiwiaWF0IjoxNzQ1Njk0NDI0LCJleHAiOjE3NDU2OTUzMjR9.OSlMjpERJhsIu2QGr9XKb2XixQzZvXZQRSwKtsi7qiKu526-s_9pCfyZPKg31f3SyEDymUknAwnklI-h4yv8_-sRL8QN6gE1Q3XAvlZiE2y59Xjb5ICjV2SkoSnQzj74_5iXjOcZ8IO01Urdm-dbRVl5gWR7JCbzl2dMihLzw4SreQbbfckjPHMJq9U65wbLd2OTuEkirhh3nqTRRE2Kq9cFEvkrTW1PBpvsaEMLYOmobDWZlkJqCD3UjEbxpjdKmUYzXAaIkEKuqX11sCjX3SwXXTIfK9RWNAWpPThsw6q6x0lUEoAm8mM-6bt6XmCstj1rqexbnjQgBgjAOhj2lg

# Request
echo "Testing rides service health via Kong..."
curl -X GET "$BASE_URL/health" -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected Outcome:
# If successful, you should get a 200 OK response
# This confirms Kong correctly routed the request to your rides service 