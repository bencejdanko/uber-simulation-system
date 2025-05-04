# Billing Service Tests

This directory contains tests for the Billing Service.

## Test Structure

- `integration/`: Integration tests that test the API endpoints
  - `test_billing_service.sh`: Shell script to test the billing service API endpoints
  - `generate-token.js`: Script to generate JWT tokens for authenticated requests
  - `setup-test-db.js`: Script to set up test data in MongoDB

## Prerequisites

Before running the tests, make sure you have:

1. Node.js and npm installed
2. MongoDB running locally (or accessible via the connection string in your .env file)
3. Required npm packages installed:
   ```
   npm install jsonwebtoken mongoose dotenv
   ```

## Setting Up the Environment

1. Create a `.env` file in the billing service root directory with the following content:
   ```
   # MongoDB Connection
   MONGODB_URI=mongodb://localhost:27017/uber_simulation

   # Service Configuration
   BILLING_SERVICE_PORT=3003

   # Kafka Configuration
   KAFKA_BROKER=localhost:9092

   # Redis Configuration (disabled for testing)
   REDIS_ENABLED=false
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # JWT Secret for Authentication
   JWT_SECRET=your_secret_key
   
   # Fixed JWT Token for Testing (optional)
   JWT_TEST_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtYWRtaW4taWQiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NDYzODQzMTMsImlhdCI6MTc0NjM4MDcxM30.c66asBp8dVSBiEG_PQmgnCFjZpkwPLPaU2ZHDt4lQv0
   ```

2. Set up the test database:
   ```
   node tests/integration/setup-test-db.js
   ```

3. Start the billing service:
   ```
   npm start
   ```

## Running the Integration Tests

1. Make the test script executable:
   ```
   chmod +x tests/integration/test_billing_service.sh
   ```

2. Run the tests:
   ```
   ./tests/integration/test_billing_service.sh
   ```

## Test Results

The test script will output the results of each test, showing which endpoints are working and which are not. A summary of passed and failed tests will be displayed at the end.

Example output:
```
=== POST /api/bills - Create Bill ===
Testing: should create a new bill with valid data
✓ PASS: Bill creation with valid data

=== GET /api/bills/:billing_id - Get Bill by ID ===
Testing: should retrieve a bill by ID
✓ PASS: Retrieve a bill by ID

...

=== Test Results Summary ===
Total tests: 10
Tests passed: 8
Tests failed: 2
```

## Authentication

The tests use JWT tokens for authentication. There are two ways to handle authentication:

1. **Using the fixed token in .env**: If you've added the `JWT_TEST_TOKEN` to your .env file, the `generate-token.js` script will use this token automatically.

2. **Generating a new token**: If you haven't set `JWT_TEST_TOKEN`, the script will generate a new token using the JWT secret in your .env file.

The token is automatically included in the test requests that require authentication.

## Troubleshooting

If you encounter issues:

1. Make sure MongoDB is running and accessible
2. Check that the billing service is running on the correct port (default: 3003)
3. Verify that your .env file has the correct configuration
4. Check the billing service logs for any errors

### Redis Connection Issues

If you're seeing Redis connection errors, run the provided script to completely remove Redis:

```
node tests/integration/remove-ioredis.js
npm install
```

This script will:
1. Remove the `ioredis` dependency from package.json
2. Remove ioredis from node_modules
3. Update the index.js file to use a mock Redis client
4. Set `REDIS_ENABLED=false` in the .env file

After running this script, restart the billing service:

```
npm start
```

If you need to use Redis in a production environment:
1. Add the `ioredis` dependency back to package.json: `npm install ioredis`
2. Make sure Redis is running on your system
3. Set `REDIS_ENABLED=true` in the .env file
4. Restore the Redis connection code in index.js