# --- LOGIN TEST via KONG ---

# Variables
KONG_PROXY_PORT=8000 # Port mapped in docker-compose for Kong's proxy
BASE_URL="http://localhost:$KONG_PROXY_PORT/api/v1/auth" # Target Kong now
# Use the LOGIN_ID and PASSWORD from a successful registration
firstName="example-first" # Replace with actual registered loginId
lastName="example-last" # Replace with actual registered loginId
email="example7@example.com" # Replace with actual registered loginId
password="StrongPassword123!" # Replace with actual password
phoneNumber="1234567890" # Replace with actual phone number

# Request
echo "Attempting login via Kong..."
curl -X POST "$BASE_URL/register/customer" \
     -H "Content-Type: application/json" \
     -d '{
            "firstName": "'"$firstName"'",
            "lastName": "'"$lastName"'",
            "email": "'"$email"'",
            "password": "'"$password"'",
            "phoneNumber": "'"$phoneNumber"'"
         }'

# Expected Outcome:
# If successful, you should get back the SAME JSON response with accessToken
# and refreshToken that you got when hitting port 3000 directly.
# This confirms Kong correctly routed the /api/v1/auth/login request to your auth-service.