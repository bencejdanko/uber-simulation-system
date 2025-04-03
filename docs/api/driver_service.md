# Driver Service API Documentation

**Version:** 1.0
**Base URL:** `/api/v1`
**Authentication:** Bearer Token (Specifics TBD - All endpoints should require authentication)
**Content-Type:** `application/json`

## Overview

The Driver Service is responsible for managing driver profiles, including creation, retrieval, updates, deletion, and searching. It handles driver information such as personal details, contact information, vehicle details, ratings, reviews, and location updates.

---

## Data Structures

### Driver Object

Represents a driver in the system. Used in GET responses, POST/PATCH responses.

```json
{
  "driverId": "string (SSN Format: xxx-xx-xxxx)",
  "firstName": "string",
  "lastName": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string (Valid US State Abbreviation or Full Name)",
    "zipCode": "string (Format: xxxxx or xxxxx-xxxx)"
  },
  "phoneNumber": "string",
  "email": "string (email format)",
  "carDetails": {
    "make": "string",
    "model": "string",
    "year": "integer",
    "color": "string",
    "licensePlate": "string"
  },
  "rating": "number (float, 1.0-5.0)",
  "reviews": [ // Optional: Array of review snippets or IDs
    {
      "reviewId": "string",
      "customerId": "string (SSN Format)",
      "rating": "integer (1-5)",
      "comment": "string",
      "timestamp": "string (ISO 8601 Format)"
    }
    // ... more reviews
  ],
  "introduction": { // URLs to stored media
    "imageUrl": "string (URL)",
    "videoUrl": "string (URL)"
  },
  "ridesHistory": [ // Array of summary objects
     { "rideId": "string", "date": "string", "fare": number }
  ],
  "currentLocation": { // Optional: driver's last known location
      "latitude": "number",
      "longitude": "number",
      "timestamp": "string (ISO 8601 Format)"
  },
  "createdAt": "string (ISO 8601 Format)",
  "updatedAt": "string (ISO 8601 Format)"
}
```

### Driver Input Object (for POST)

Used in the request body when creating a new driver. `driverId` must be provided and adhere to SSN format.

```json
{
  "driverId": "string (SSN Format: xxx-xx-xxxx)", // Required
  "firstName": "string", // Required
  "lastName": "string", // Required
  "address": { // Required
    "street": "string", // Required
    "city": "string", // Required
    "state": "string (Valid US State Abbreviation or Full Name)", // Required
    "zipCode": "string (Format: xxxxx or xxxxx-xxxx)" // Required
  },
  "phoneNumber": "string", // Required
  "email": "string (email format)", // Required
  "carDetails": { // Required
    "make": "string", // Required
    "model": "string", // Required
    "year": "integer", // Required
    "color": "string", // Required
    "licensePlate": "string" // Required
  },
  "introduction": { // Optional
    "imageUrl": "string (URL)",
    "videoUrl": "string (URL)"
  }
  // Rating, Reviews, RidesHistory, Location are typically not set on creation
}
```

### Driver Update Object (for PATCH)

Used in the request body when updating a driver. Only include fields that need to be changed.

```json
{
  "firstName": "string", // Optional
  "lastName": "string", // Optional
  "address": { // Optional, include fields within address to change
    "street": "string",
    "city": "string",
    "state": "string (Valid US State Abbreviation or Full Name)",
    "zipCode": "string (Format: xxxxx or xxxxx-xxxx)"
  },
  "phoneNumber": "string", // Optional
  "email": "string (email format)", // Optional
  "carDetails": { // Optional, include fields within carDetails to change
    "make": "string",
    "model": "string",
    "year": "integer",
    "color": "string",
    "licensePlate": "string"
  },
  "introduction": { // Optional
    "imageUrl": "string (URL)",
    "videoUrl": "string (URL)"
  },
  // Note: Rating and Reviews might be updated by other services (e.g., Rides/Billing)
  // but this endpoint *could* allow admin updates if needed.
  "rating": "number (float, 1.0-5.0)", // Optional - Use with caution
  "reviews": [ /* ... */ ] // Optional - Use with caution
}
```

### Location Update Object (for PATCH /location)

```json
{
  "latitude": "number", // Required
  "longitude": "number" // Required
}
```

### Error Response Object

Standard format for error responses.

```json
{
  "error": "string (error code, e.g., 'invalid_input', 'not_found')",
  "message": "string (detailed error message)"
}
```

---

## Endpoints

### 1. Create Driver

*   **Description:** Registers a new driver in the system.
*   **Endpoint:** `POST /drivers`
*   **Request Body:** `Driver Input Object`
*   **Responses:**
    *   `201 Created`: Driver successfully created. Response body contains the created `Driver Object`. Includes `Location` header: `/drivers/{new_driver_id}`.
    *   `400 Bad Request`: Invalid input data (e.g., missing required fields, invalid email format, invalid SSN format for `driverId`, invalid state, invalid zip code). Response body contains `Error Response Object`.
        *   Example Error Codes: `invalid_input`, `missing_required_field`, `invalid_ssn_format`, `malformed_state`, `malformed_zipcode`.
    *   `409 Conflict`: A driver with the provided `driverId` already exists. Response body contains `Error Response Object`.
        *   Example Error Code: `duplicate_driver`.
    *   `500 Internal Server Error`: Unexpected server error.

### 2. Get Driver by ID

*   **Description:** Retrieves the full details of a specific driver.
*   **Endpoint:** `GET /drivers/{driver_id}`
*   **Path Parameters:**
    *   `driver_id` (string, required): The SSN format ID of the driver to retrieve.
*   **Responses:**
    *   `200 OK`: Driver details successfully retrieved. Response body contains the `Driver Object`.
    *   `400 Bad Request`: Invalid `driver_id` format provided in the path. Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_driver_id_format`.
    *   `404 Not Found`: No driver found with the specified `driver_id`. Response body contains `Error Response Object`.
        *   Example Error Code: `driver_not_found`.
    *   `500 Internal Server Error`: Unexpected server error.

### 3. Update Driver Information

*   **Description:** Updates specific fields for an existing driver. Supports partial updates.
*   **Endpoint:** `PATCH /drivers/{driver_id}`
*   **Path Parameters:**
    *   `driver_id` (string, required): The SSN format ID of the driver to update.
*   **Request Body:** `Driver Update Object` (containing only the fields to be updated).
*   **Responses:**
    *   `200 OK`: Driver successfully updated. Response body contains the updated `Driver Object`.
    *   `400 Bad Request`: Invalid input data in the request body (e.g., invalid email format, invalid state, invalid zip code). Response body contains `Error Response Object`.
        *   Example Error Codes: `invalid_input`, `malformed_state`, `malformed_zipcode`.
    *   `400 Bad Request`: Invalid `driver_id` format provided in the path. Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_driver_id_format`.
    *   `404 Not Found`: No driver found with the specified `driver_id`. Response body contains `Error Response Object`.
        *   Example Error Code: `driver_not_found`.
    *   `500 Internal Server Error`: Unexpected server error.

### 4. Delete Driver

*   **Description:** Removes a driver from the system. (Consider soft delete vs hard delete).
*   **Endpoint:** `DELETE /drivers/{driver_id}`
*   **Path Parameters:**
    *   `driver_id` (string, required): The SSN format ID of the driver to delete.
*   **Responses:**
    *   `204 No Content`: Driver successfully deleted. No response body.
    *   `400 Bad Request`: Invalid `driver_id` format provided in the path. Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_driver_id_format`.
    *   `404 Not Found`: No driver found with the specified `driver_id`. Response body contains `Error Response Object`.
        *   Example Error Code: `driver_not_found`.
    *   `500 Internal Server Error`: Unexpected server error.

### 5. List and Search Drivers

*   **Description:** Retrieves a list of drivers, optionally filtered by provided criteria.
*   **Endpoint:** `GET /drivers`
*   **Query Parameters (Optional):**
    *   `city` (string): Filter by city.
    *   `state` (string): Filter by state abbreviation or full name.
    *   `zipCode` (string): Filter by zip code.
    *   `min_rating` (number): Filter drivers with rating >= this value.
    *   `car_make` (string): Filter by car make.
    *   `car_model` (string): Filter by car model.
    *   `limit` (integer, default: 20): Maximum number of results to return (for pagination).
    *   `offset` (integer, default: 0): Number of results to skip (for pagination).
*   **Responses:**
    *   `200 OK`: Successfully retrieved list of drivers. Response body contains a JSON array of `Driver Object`s matching the criteria. The array might be empty if no drivers match. Include pagination headers if implemented (e.g., `X-Total-Count`).
    *   `400 Bad Request`: Invalid format for query parameters (e.g., non-numeric `min_rating`). Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_query_parameter`.
    *   `500 Internal Server Error`: Unexpected server error.

### 6. Update Driver Location

*   **Description:** Allows a driver (or the system simulating the driver's app) to update their current geographical location. This is crucial for matching drivers with nearby ride requests.
*   **Endpoint:** `PATCH /drivers/{driver_id}/location`
*   **Path Parameters:**
    *   `driver_id` (string, required): The SSN format ID of the driver whose location is being updated.
*   **Request Body:** `Location Update Object`
*   **Responses:**
    *   `200 OK`: Location successfully updated. Response body could optionally contain the updated `Driver Object` or just the updated location part.
    *   `204 No Content`: Location successfully updated. No response body. (Choose one: 200 or 204).
    *   `400 Bad Request`: Invalid input data (missing latitude/longitude, non-numeric values). Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_location_data`.
    *   `400 Bad Request`: Invalid `driver_id` format provided in the path. Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_driver_id_format`.
    *   `404 Not Found`: No driver found with the specified `driver_id`. Response body contains `Error Response Object`.
        *   Example Error Code: `driver_not_found`.
    *   `500 Internal Server Error`: Unexpected server error.

---

## Validation Notes

*   **SSN Format:** All `driverId` and `customerId` fields must strictly adhere to the `xxx-xx-xxxx` format.
*   **State:** State fields must be validated against a list of valid US state abbreviations or full names. Return `malformed_state` error if invalid.
*   **Zip Code:** Zip code fields must adhere to `xxxxx` or `xxxxx-xxxx` format. Return `malformed_zipcode` error if invalid.
*   **Email:** Email fields should undergo basic format validation.
*   **Phone Number:** Consider standardizing or validating phone number formats if necessary.
*   **Rating:** Numeric ratings should be within the valid range (e.g., 1.0 to 5.0).

---