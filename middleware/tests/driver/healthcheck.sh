# --- LOGIN TEST via KONG ---

# Variables
KONG_PROXY_PORT=8000 # Port mapped in docker-compose for Kong's proxy
BASE_URL="http://localhost:$KONG_PROXY_PORT/api/v1/drivers" # Target Kong now
# Use the LOGIN_ID and PASSWORD from a successful registration

ACCESS_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF1dGgtc2VydmljZS1rZXktMSJ9.eyJzdWIiOiJlZjA3NTJjYS1mMjlhLTQzYTgtOTIyNS00M2NmNzFlZmY4MmIiLCJyb2xlcyI6WyJEUklWRVIiXSwiaXNzIjoiaHR0cHM6Ly9teS1hdXRoLXNlcnZpY2UuY29tIiwiaWF0IjoxNzQ1MTM2Nzc1LCJleHAiOjE3NDUxMzc2NzV9.RANsQxTfMg3CJsy1AcbzvEFzhqLfuc8M3ZMS_NTXOdkJ3iKpto2TZrtOoRBnTTQzfPbjgNUU4LQ7IuusSLNotJFwy6f3ju-GOEMjYlK0Y5cV1m_VChKwOPWBjUWxq5IoY8hx8dHmpD9PrBLP28l-J0u3_MwcpEYscHQ5kMHcPC_huE37Wy2SRbPAschEteN6U-O9jPJuLmj2id9mKH74K6pb_aMFACMJ-bYci2o68NeXD9J7BaPxLnTj6RZ1viwz8zo0kn15KvGY4-yfMwL7dHRuLAZtBHLkAiVdrfgA_WCLtkCsa-f2HdMcz4QDKbmNA-aBJTjgHje7qMCA4i_2ag

# Request
echo "Attempting login via Kong..."
curl -X GET "$BASE_URL/health" -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected Outcome:
# If successful, you should get back the SAME JSON response with accessToken
# and refreshToken that you got when hitting port 3000 directly.
# This confirms Kong correctly routed the /api/v1/auth/login request to your auth-service.