# --- LOGIN TEST via KONG ---

# Variables
KONG_PROXY_PORT=8000 # Port mapped in docker-compose for Kong's proxy
BASE_URL="http://localhost:$KONG_PROXY_PORT/api/v1/auth" # Target Kong now
# Use the LOGIN_ID and PASSWORD from a successful registration
LOGIN_ID="example@example.com" # Replace with actual registered loginId
PASSWORD="StrongPassword123!" # Replace with actual password

# Request
echo "Attempting login via Kong..."
curl -X POST "$BASE_URL/login" \
     -H "Content-Type: application/json" \
     -d '{
           "email": "'"$LOGIN_ID"'",
           "password": "'"$PASSWORD"'"
         }'

# Expected Outcome:
# If successful, you should get back the SAME JSON response with accessToken
# and refreshToken that you got when hitting port 3000 directly.
# This confirms Kong correctly routed the /api/v1/auth/login request to your auth-service.