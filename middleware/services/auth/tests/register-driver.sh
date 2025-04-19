# Variables
PORT=3000 # Replace with your actual port
BASE_URL="http://localhost:$PORT/api/v1/auth"
LOGIN_ID="driver-$(date +%s)@example.com"
FIRST_NAME="Test"
LAST_NAME="Driver"
EMAIL=$LOGIN_ID
PASSWORD="StrongPassword123!"
PHONE="0987654321"
# Add address and carDetails if required by your implementation based on docs/middleware/auth.md

# Request
curl -X POST "$BASE_URL/register/driver" \
     -H "Content-Type: application/json" \
     -d '{
           "loginId": "'"$LOGIN_ID"'",
           "firstName": "'"$FIRST_NAME"'",
           "lastName": "'"$LAST_NAME"'",
           "email": "'"$EMAIL"'",
           "password": "'"$PASSWORD"'",
           "phoneNumber": "'"$PHONE"'"
         }'

echo $LOGIN_ID
echo $PASSWORD