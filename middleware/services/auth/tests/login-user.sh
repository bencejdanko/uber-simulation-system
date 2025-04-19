# Variables
PORT=3000 # Replace with your actual port
BASE_URL="http://localhost:$PORT/api/v1/auth"
# Use the LOGIN_ID and PASSWORD from a successful registration
LOGIN_ID="driver-1745090322@example.com" # Replace with actual registered loginId
PASSWORD="StrongPassword123!" # Replace with actual password

# Request
curl -X POST "$BASE_URL/login" \
     -H "Content-Type: application/json" \
     -d '{
           "email": "'"$LOGIN_ID"'",
           "password": "'"$PASSWORD"'"
         }'