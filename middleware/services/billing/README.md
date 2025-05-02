# Uber Simulation - Billing Service

This service is responsible for managing billing information for the Uber simulation system. It handles the creation, retrieval, and management of bills for completed rides, as well as implementing the dynamic pricing algorithm.

## Features

- Create bills for completed rides
- Retrieve bill details by ID
- Search/list bills with filtering options
- Delete bills (though in real systems, voiding would be preferred)
- Update bill payment status
- Generate revenue statistics
- Dynamic pricing algorithm with surge pricing
- Distance and travel time calculations

## API Endpoints

### Bill Endpoints

- `POST /api/v1/bills` - Create a new bill
- `GET /api/v1/bills/:billing_id` - Get a bill by ID
- `GET /api/v1/bills` - Search/list bills
- `DELETE /api/v1/bills/:billing_id` - Delete a bill
- `PATCH /api/v1/bills/:billing_id/payment` - Update bill payment status
- `GET /api/v1/bills/stats/revenue` - Get revenue statistics

### Pricing Endpoints

- `POST /api/v1/pricing/predict` - Calculate predicted fare
- `POST /api/v1/pricing/actual` - Calculate actual fare
- `GET /api/v1/pricing/surge` - Get surge multiplier for a location
- `POST /api/v1/pricing/distance` - Calculate distance between two points
- `POST /api/v1/pricing/time` - Estimate travel time

## Dynamic Pricing Algorithm

The dynamic pricing algorithm is based on several factors:

1. **Base Fare Calculation**: A base fare plus time and distance components.
2. **Surge Pricing**: Adjusts prices based on demand and supply imbalances.
3. **Time of Day**: Different pricing for rush hours vs. normal hours.
4. **Day of Week**: Different pricing for weekdays vs. weekends.
5. **Special Events**: Increased pricing during special events.
6. **Weather Conditions**: Increased pricing during bad weather.

The algorithm uses Redis for caching surge multipliers and other calculated values to improve performance.

## Data Model

### Bill

- `billingId`: Unique identifier in SSN format (xxx-xx-xxxx)
- `rideId`: Reference to the ride in SSN format
- `customerId`: Reference to the customer in SSN format
- `driverId`: Reference to the driver in SSN format
- `date`: Date of the ride/billing event
- `pickupTime`: Time when the ride started
- `dropoffTime`: Time when the ride ended
- `distanceCovered`: Distance covered in miles
- `sourceLocation`: Pickup location coordinates
- `destinationLocation`: Dropoff location coordinates
- `predictedAmount`: Fare prediction shown to user initially
- `actualAmount`: Final calculated fare
- `paymentStatus`: Status of the payment (PENDING, PAID, FAILED, VOID)
- `paymentDetails`: Details about the payment method
- `fareBreakdown`: Breakdown of the fare components
- `createdAt`: Timestamp when the bill was created
- `updatedAt`: Timestamp when the bill was last updated

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables in a `.env` file:
   ```
   MONGODB_URI=mongodb+srv://cluster236.4ozrrvt.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Cluster236
   MONGODB_CLIENT_CERT_PATH=/path/to/X509-cert.pem
   REDIS_HOST=localhost
   REDIS_PORT=6379
   KAFKA_BROKER=localhost:9092
   BILLING_SERVICE_PORT=3003
   ```
   
   Note: The project uses MongoDB Atlas Cloud for database storage with X.509 certificate authentication. The actual connection string is already configured in the root `.env` file.

3. Start the service:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

## Integration with Other Services

- **Rides Service**: The billing service listens for ride completion events from the Rides Service via Kafka to automatically create bills.
- **Payment Processing**: The billing service records payment information but does not process payments directly. In a real system, it would integrate with a payment gateway.
- **Admin Service**: The billing service provides revenue statistics for the Admin Service.

## Caching Strategy

The service uses Redis for caching:

- Bill details are cached for 5 minutes
- Search results are cached for 1 minute
- Revenue statistics are cached for 5 minutes
- Surge multipliers are cached for 5 minutes

This caching strategy helps improve performance and reduce database load.