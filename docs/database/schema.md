# Rides Service API Documentation

**Version:** 1.0
**Base URL:** `/api/v1`
**Authentication:** Bearer Token (Specifics TBD - All endpoints should require authentication, usually Customer or Driver context)
**Content-Type:** `application/json`

## Overview

The Rides Service manages the lifecycle of a ride request and the subsequent trip. It handles ride creation (requests), matching customers with nearby drivers, tracking ride status, retrieving ride details, and managing cancellations. It interacts with other services like Pricing (for fare estimation), Driver Service (for location and status), Customer Service, and potentially triggers events for Billing and Rating upon completion.

**Note on ID Formats:** The project specification requests SSN Format (xxx-xx-xxxx) for Ride ID, Customer ID, and Driver ID. This documentation adheres to that specification.

---

## Data Structures

### Ride Object

Represents a ride instance in the system.

```json
{
  "rideId": "string (SSN Format: xxx-xx-xxxx)", // As per spec
  "customerId": "string (SSN Format: xxx-xx-xxxx)",
  "driverId": "string (SSN Format: xxx-xx-xxxx) | null", // Assigned after matching
  "pickupLocation": {
    "latitude": "number",
    "longitude": "number",
    "addressLine": "string (Optional: textual representation)" // Optional
  },
  "dropoffLocation": {
    "latitude": "number",
    "longitude": "number",
    "addressLine": "string (Optional: textual representation)" // Optional
  },
  "status": "string (Enum: REQUESTED, ACCEPTED, DRIVER_ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED_CUSTOMER, CANCELLED_DRIVER, NO_DRIVERS_AVAILABLE)",
  "requestTimestamp": "string (ISO 8601 Format)",
  "acceptTimestamp": "string (ISO 8601 Format) | null",
  "pickupTimestamp": "string (ISO 8601 Format) | null", // When ride actually starts
  "dropoffTimestamp": "string (ISO 8601 Format) | null", // When ride ends
  "predictedFare": "number (Currency, e.g., USD) | null", // Calculated at request time
  "actualFare": "number (Currency, e.g., USD) | null", // Calculated after completion
  "distance": "number (e.g., miles or km) | null", // Calculated after completion
  "createdAt": "string (ISO 8601 Format)",
  "updatedAt": "string (ISO 8601 Format)"
}
```

### Ride Request Input Object (for POST)

Used by a customer to request a new ride.

```json
{
  // customerId is typically derived from the authenticated user token
  "pickupLocation": {         // Required
    "latitude": "number",     // Required
    "longitude": "number"    // Required
  },
  "dropoffLocation": {        // Required
    "latitude": "number",     // Required
    "longitude": "number"    // Required
  }
  // passenger_count might be added here if needed for pricing/matching
}
```

### Nearby Driver Object (Response from GET /drivers/nearby)

Simplified representation of a driver for matching purposes.

```json
{
    "driverId": "string (SSN Format)",
    "currentLocation": {
        "latitude": "number",
        "longitude": "number"
    },
    "estimatedArrivalTimeSeconds": "number | null", // Optional: calculated ETA to pickup
    "rating": "number (float)", // Optional: for matching preference
    "carDetails": { // Optional: for display/preference
        "make": "string",
        "model": "string",
        "color": "string"
    }
}
```

### Error Response Object

Standard format for error responses.

```json
{
  "error": "string (error code, e.g., 'invalid_input', 'not_found', 'no_drivers', 'ride_not_cancellable')",
  "message": "string (detailed error message)"
}
```

---

## Endpoints

### 1. Request Ride

*   **Description:** A customer requests a new ride from their current location to a destination. This initiates the driver matching process.
*   **Endpoint:** `POST /rides`
*   **Request Body:** `Ride Request Input Object`
*   **Responses:**
    *   `202 Accepted`: Ride request successfully received and driver matching initiated. Response body contains the initial `Ride Object` with status `REQUESTED` and a `predictedFare`.
    *   `400 Bad Request`: Invalid input data (e.g., missing locations, invalid coordinates). Response body contains `Error Response Object`.
        *   Example Error Codes: `invalid_input`, `missing_location`, `invalid_coordinates`.
    *   `401 Unauthorized`: Customer authentication failed.
    *   `404 Not Found` (or a specific 4xx/5xx): Could indicate failure during initial processing like price prediction or inability to even start the matching process. Could also represent "No drivers available nearby" if checked synchronously (though often handled asynchronously).
        *   Example Error Code: `pricing_error`, `service_unavailable`.
    *   `503 Service Unavailable`: If the matching system or dependent services (like Pricing, Driver location) are temporarily unavailable.
    *   `500 Internal Server Error`: Unexpected server error during request processing or matching initiation.

### 2. Get Ride Details

*   **Description:** Retrieves the current status and details of a specific ride. Accessible by the customer or the assigned driver (or admin).
*   **Endpoint:** `GET /rides/{ride_id}`
*   **Path Parameters:**
    *   `ride_id` (string, required): The SSN format ID of the ride to retrieve.
*   **Responses:**
    *   `200 OK`: Ride details successfully retrieved. Response body contains the `Ride Object`.
    *   `400 Bad Request`: Invalid `ride_id` format. Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_ride_id_format`.
    *   `401 Unauthorized`: Authentication failed.
    *   `403 Forbidden`: Authenticated user is not the customer or assigned driver for this ride (and not an admin).
    *   `404 Not Found`: No ride found with the specified `ride_id`. Response body contains `Error Response Object`.
        *   Example Error Code: `ride_not_found`.
    *   `500 Internal Server Error`: Unexpected server error.

### 3. List Rides

*   **Description:** Retrieves a list of rides associated with the authenticated user (customer or driver), optionally filtered.
*   **Endpoint:** `GET /rides`
*   **Query Parameters (Optional):**
    *   `status` (string, Enum: See Ride Object status): Filter by ride status. Can potentially accept multiple statuses (e.g., `status=COMPLETED,CANCELLED`).
    *   `limit` (integer, default: 20): Maximum number of results to return (for pagination).
    *   `offset` (integer, default: 0): Number of results to skip (for pagination).
    *   `start_date` (string, YYYY-MM-DD): Filter rides requested on or after this date.
    *   `end_date` (string, YYYY-MM-DD): Filter rides requested on or before this date.
    *   `for_customer_id` (string, SSN Format - Admin Only): Filter by customer ID (requires admin privileges).
    *   `for_driver_id` (string, SSN Format - Admin Only): Filter by driver ID (requires admin privileges).
*   **Responses:**
    *   `200 OK`: Successfully retrieved list of rides. Response body contains a JSON array of `Ride Object`s matching the criteria. The array might be empty. Include pagination headers if implemented (e.g., `X-Total-Count`).
    *   `400 Bad Request`: Invalid format for query parameters (e.g., invalid status enum, invalid date format). Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_query_parameter`.
    *   `401 Unauthorized`: Authentication failed.
    *   `403 Forbidden`: Non-admin user attempting to use `for_customer_id` or `for_driver_id`.
    *   `500 Internal Server Error`: Unexpected server error.

### 4. Cancel Ride (Delete Ride)

*   **Description:** Cancels an active ride request or an accepted ride *before* it enters the `IN_PROGRESS` state. Fulfills the "Delete an existing ride" requirement.
*   **Endpoint:** `DELETE /rides/{ride_id}`
*   **Path Parameters:**
    *   `ride_id` (string, required): The SSN format ID of the ride to cancel.
*   **Responses:**
    *   `204 No Content`: Ride successfully cancelled.
    *   `400 Bad Request`: Invalid `ride_id` format. Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_ride_id_format`.
    *   `401 Unauthorized`: Authentication failed.
    *   `403 Forbidden`: Authenticated user is not authorized to cancel this ride (e.g., not the customer or assigned driver in an appropriate state).
    *   `404 Not Found`: No ride found with the specified `ride_id`. Response body contains `Error Response Object`.
        *   Example Error Code: `ride_not_found`.
    *   `409 Conflict`: The ride is not in a cancellable state (e.g., already `COMPLETED` or `IN_PROGRESS`). Response body contains `Error Response Object`.
        *   Example Error Code: `ride_not_cancellable`.
    *   `500 Internal Server Error`: Unexpected server error.

### 5. Find Nearby Drivers

*   **Description:** Retrieves a list of available drivers within a specified radius of a given location. Useful for the client UI to show nearby cars or for the backend matching algorithm. Fulfills "Display the location of drivers within 10 miles".
*   **Endpoint:** `GET /drivers/nearby`
*   **Query Parameters (Required):**
    *   `latitude` (number): Latitude of the center point (e.g., customer pickup location).
    *   `longitude` (number): Longitude of the center point.
*   **Query Parameters (Optional):**
    *   `radius_miles` (number, default: 10): Search radius in miles.
*   **Responses:**
    *   `200 OK`: Successfully retrieved list of nearby available drivers. Response body contains a JSON array of `Nearby Driver Object`s. The array might be empty.
    *   `400 Bad Request`: Invalid or missing latitude/longitude, invalid radius. Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_coordinates`, `missing_coordinates`.
    *   `401 Unauthorized`: Authentication failed (if required for this endpoint).
    *   `500 Internal Server Error`: Unexpected server error querying driver locations.

---

## State Transitions & Events (Conceptual)

The `status` field follows a state machine. Transitions are triggered by events (often via Kafka or direct internal calls):

1.  `POST /rides` -> Creates Ride with status `REQUESTED`.
2.  Matching Algo finds driver -> Driver Accepts (via Driver App interaction, potentially another API endpoint not listed here) -> Status changes to `ACCEPTED`. -> *Event: RideAccepted* (Payload: rideId, driverId, customerId).
3.  Driver reaches pickup -> Driver marks arrival (via Driver App) -> Status changes to `DRIVER_ARRIVED`. -> *Event: DriverArrived* (Payload: rideId, driverId).
4.  Customer gets in, ride starts -> Driver starts trip (via Driver App) -> Status changes to `IN_PROGRESS`. -> *Event: RideStarted* (Payload: rideId).
5.  Ride finishes -> Driver ends trip (via Driver App) -> Status changes to `COMPLETED`. -> Calculate `actualFare` & `distance`. -> *Event: RideCompleted* (Payload: rideId, customerId, driverId, actualFare, distance, start/end times & locations). -> Billing Service consumes this. Rating mechanism might be triggered.
6.  `DELETE /rides/{ride_id}` called by Customer before ACCEPTED/IN_PROGRESS -> Status changes to `CANCELLED_CUSTOMER`. -> *Event: RideCancelled* (Payload: rideId, cancelledBy="customer").
7.  Driver cancels before pickup (via Driver App) -> Status changes to `CANCELLED_DRIVER`. -> *Event: RideCancelled* (Payload: rideId, cancelledBy="driver"). -> Potentially re-initiate matching.
8.  Matching Algo fails after timeout -> Status changes to `NO_DRIVERS_AVAILABLE`. -> *Event: MatchingFailed* (Payload: rideId, customerId).

## Considerations

*   **Matching Logic:** The core driver matching algorithm is complex and happens behind the scenes after `POST /rides`. It needs efficient querying of driver locations and availability (potentially using Geo-spatial indexing and the Driver Service or a dedicated location cache).
*   **Driver Actions:** Driver interactions like accepting a ride, marking arrival, starting/ending the trip are typically handled via endpoints exposed specifically for the driver application, not usually listed in the primary customer-facing API docs. These actions trigger status updates and events within the Rides Service.
*   **Pricing Integration:** Needs to call the dynamic pricing logic/service during the `POST /rides` request to get the `predictedFare` and after completion to calculate the `actualFare` (or receive it in the `RideCompleted` event payload).
*   **Kafka Integration:** This service is a prime candidate for producing events (RideAccepted, RideCompleted, etc.) and potentially consuming events (e.g., DriverLocationUpdated).
*   **Concurrency:** Handling multiple simultaneous ride requests, driver location updates, and status changes requires careful design to avoid race conditions.