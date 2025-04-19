# Variables
PORT=3000 # Replace with your actual port
BASE_URL="http://localhost:$PORT/api/v1/auth"
LOGIN_ID="customer-$(date +%s)@example.com"
FIRST_NAME="Test"
LAST_NAME="Customer"
EMAIL=$LOGIN_ID
PASSWORD="StrongPassword123!"
PHONE="1234567890"

# Request
curl -X POST "$BASE_URL/register/customer" \
     -H "Content-Type: application/json" \
     -d '{
           "loginId": "'"$LOGIN_ID"'",
           "firstName": "'"$FIRST_NAME"'",
           "lastName": "'"$LAST_NAME"'",
           "email": "'"$EMAIL"'",
           "password": "'"$PASSWORD"'",
           "phoneNumber": "'"$PHONE"'"
         }'

