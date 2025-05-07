#!/bin/bash

# Define base API URL and JWT Token
API_URL="http://localhost:3000/api/v1/admin"
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiMTIzLTQ1LTY3ODkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NDY2NTA4NjIsImV4cCI6MTc0NjY1NDQ2Mn0.r9GJDOa5M-bWH95onnKoZYxod9V0gR0fKvkCaO7QEWY"

# Driver payload
driverPayload='{
  "driverId": "123-45-6789",
  "firstName": "John",
  "lastName": "Doe",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "phoneNumber": "1234567890",
  "email": "john.doe@example.com",
  "carDetails": {
    "make": "Toyota",
    "model": "Camry",
    "year": 2020,
    "color": "Blue",
    "licensePlate": "ABC123"
  }
}'

# Customer payload
customerPayload='{
  "customerId": "123-45-6789",
  "firstName": "Jane",
  "lastName": "Doe",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "NY",
    "zipCode": "10001"
  },
  "phoneNumber": "9876543210",
  "email": "jane.doe@example.com",
  "creditCardDetails": {
    "last4Digits": "1234",
    "cardType": "Visa",
    "expiryMonth": 12,
    "expiryYear": 2025
  }
}'

# Bill payload
billPayload='{
  "billingId": "123-45-6789",
  "rideId": "999-99-9999",
  "customerId": "123-45-6789",
  "driverId": "123-45-6789",
  "date": "2025-05-05",
  "pickupTime": "2025-05-05T08:00:00Z",
  "dropoffTime": "2025-05-05T08:30:00Z",
  "distanceCovered": 10.5,
  "sourceLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "addressLine": "123 Main St, New York, NY"
  },
  "destinationLocation": {
    "latitude": 40.7306,
    "longitude": -73.9352,
    "addressLine": "456 Broadway, New York, NY"
  },
  "predictedAmount": 25.00,
  "actualAmount": 27.50,
  "paymentStatus": "PAID",
  "createdAt": "2025-05-05T08:00:00Z",
  "updatedAt": "2025-05-05T08:30:00Z"
}'

# 1. Test POST /drivers (Create a driver)
echo "--------------------------------------------------"
echo "Testing POST /drivers"
response=$(curl -s -w "%{http_code}" -o response.json -X POST "$API_URL/drivers" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$driverPayload")

if [ "$response" -eq 201 ]; then
  echo "Driver created successfully!"
else
  echo "POST /drivers failed with status: $response"
fi
echo ""

# 2. Test GET /drivers/:driver_id (Retrieve driver)
echo "--------------------------------------------------"
echo "Testing GET /drivers/123-45-6789"
response=$(curl -s -w "%{http_code}" -o response.json -X GET "$API_URL/drivers/123-45-6789" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

if [ "$response" -eq 200 ]; then
  echo "Driver retrieved successfully!"
  cat response.json
else
  echo "GET /drivers/123-45-6789 failed with status: $response"
fi
echo ""

# 3. Test POST /customers (Create a customer)
echo "--------------------------------------------------"
echo "Testing POST /customers"
response=$(curl -s -w "%{http_code}" -o response.json -X POST "$API_URL/customers" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$customerPayload")

if [ "$response" -eq 201 ]; then
  echo "Customer created successfully!"
else
  echo "POST /customers failed with status: $response"
fi
echo ""

# 4. Test GET /customers/:customer_id (Retrieve customer)
echo "--------------------------------------------------"
echo "Testing GET /customers/123-45-6789"
response=$(curl -s -w "%{http_code}" -o response.json -X GET "$API_URL/customers/123-45-6789" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

if [ "$response" -eq 200 ]; then
  echo "Customer retrieved successfully!"
  cat response.json
else
  echo "GET /customers/123-45-6789 failed with status: $response"
fi
echo ""

# 5. Test GET /bills (Get all bills)
echo "--------------------------------------------------"
echo "Testing GET /bills"
response=$(curl -s -w "%{http_code}" -o response.json -X GET "$API_URL/bills" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

if [ "$response" -eq 200 ]; then
  echo "Bills retrieved successfully!"
  cat response.json
else
  echo "GET /bills failed with status: $response"
fi
echo ""

# 6. Test GET /bills/:billing_id (Retrieve a bill)
echo "--------------------------------------------------"
echo "Testing GET /bills/123-45-6789"
response=$(curl -s -w "%{http_code}" -o response.json -X GET "$API_URL/bills/123-45-6789" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

if [ "$response" -eq 200 ]; then
  echo "Bill retrieved successfully!"
  cat response.json
else
  echo "GET /bills/123-45-6789 failed with status: $response"
fi
echo ""

# 7. Test GET /statistics (Retrieve statistics)
echo "--------------------------------------------------"
echo "Testing GET /statistics"
response=$(curl -s -w "%{http_code}" -o response.json -X GET "$API_URL/statistics?start_date=2025-01-01&end_date=2025-05-01" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

if [ "$response" -eq 200 ]; then
  echo "Statistics retrieved successfully!"
  cat response.json
else
  echo "GET /statistics failed with status: $response"
fi
echo ""

# 8. Test GET /charts (Retrieve chart data)
echo "--------------------------------------------------"
echo "Testing GET /charts"
response=$(curl -s -w "%{http_code}" -o response.json -X GET "$API_URL/charts?chart_type=ride_volume&start_date=2025-01-01&end_date=2025-05-01" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

if [ "$response" -eq 200 ]; then
  echo "Chart data retrieved successfully!"
  cat response.json
else
  echo "GET /charts failed with status: $response"
fi
echo ""

# Test for missing parameters on /statistics
echo "--------------------------------------------------"
echo "Testing GET /statistics without start_date and end_date"
response=$(curl -s -w "%{http_code}" -o response.json -X GET "$API_URL/statistics" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

if [ "$response" -eq 400 ]; then
  echo "GET /statistics returned 400 as expected"
else
  echo "GET /statistics failed with status: $response"
fi
echo ""

# Test for missing parameters on /charts
echo "--------------------------------------------------"
echo "Testing GET /charts without chart_type"
response=$(curl -s -w "%{http_code}" -o response.json -X GET "$API_URL/charts?start_date=2025-01-01&end_date=2025-05-01" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

if [ "$response" -eq 400 ]; then
  echo "GET /charts returned 400 as expected"
else
  echo "GET /charts failed with status: $response"
fi
echo ""

# End of script
echo "All tests completed!"
