# Customer Service API Documentation

**Version:** 1.0
**Base URL:** `/api/v1`
**Authentication:** Bearer Token (Specifics TBD - All endpoints should require authentication)
**Content-Type:** `application/json` (except for image upload)

## Overview

The Customer Service is responsible for managing customer profiles, including creation, retrieval, updates, deletion, and searching. It handles customer information such as personal details, contact information, payment details, ratings, reviews, and ride history associations.

---

## Data Structures

### Customer Object

Represents a customer in the system. Used in GET responses, POST/PATCH responses.

```json
{
  "customerId": "string (SSN Format: xxx-xx-xxxx)",
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
  "creditCardDetails": { // **SECURITY NOTE:** Storing raw CC details is highly insecure. Use tokenization or store only non-sensitive parts (last 4 digits, type) in production.
    "last4Digits": "string",
    "cardType": "string (e.g., Visa, Mastercard)",
    "expiryMonth": "integer (1-12)",
    "expiryYear": "integer (YYYY)"
    // Raw number and CVV should NOT be stored directly in a real system.
  },
  "rating": "number (float, 1.0-5.0, given by drivers)", // Managed externally
  "reviews": [ // Optional: Array of review snippets or IDs (reviews *about* the customer)
    {
      "reviewId": "string",
      "driverId": "string (SSN Format)",
      "rating": "integer (1-5)",
      "comment": "string",
      "timestamp": "string (ISO 8601 Format)"
    }
    // ... more reviews
  ],
  "ridesHistory": [ // Array of summary objects
    { "rideId": "string", "date": "string", "fare": number }
    // ... more ride IDs/summaries
  ],
  "createdAt": "string (ISO 8601 Format)",
  "updatedAt": "string (ISO 8601 Format)"
}
```

### Customer Input Object (for POST)

Used in the request body when creating a new customer. `customerId` must be provided and adhere to SSN format.

```json
{
  "customerId": "string (SSN Format: xxx-xx-xxxx)", // Required
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
  "creditCardDetails": { // Required - **SECURITY NOTE:** See Customer Object note. For simulation, include fields needed.
    "cardNumber": "string", // **Insecure for production**
    "expiryMonth": "integer (1-12)", // Required
    "expiryYear": "integer (YYYY)", // Required
    "cvv": "string" // **Highly Insecure for production**
  }
  // Rating, Reviews, RidesHistory are typically not set on creation
}
```

### Customer Update Object (for PATCH)

Used in the request body when updating a customer. Only include fields that need to be changed.

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
  "creditCardDetails": { // Optional - **SECURITY NOTE:** Handle updates carefully.
    "cardNumber": "string", // **Insecure for production**
    "expiryMonth": "integer (1-12)",
    "expiryYear": "integer (YYYY)",
    "cvv": "string" // **Highly Insecure for production**
  }
  // Note: Rating and Reviews might be updated by other services (e.g., Rides/Billing)
}
```

### Image Upload Response Object

```json
{
  "imageUrl": "string (URL of the uploaded image)"
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

### 1. Create Customer

*   **Description:** Registers a new customer in the system.
*   **Endpoint:** `POST /customers`
*   **Request Body:** `Customer Input Object`
*   **Responses:**
    *   `201 Created`: Customer successfully created. Response body contains the created `Customer Object` (with sensitive CC details masked/omitted as per security policy). Includes `Location` header: `/customers/{new_customer_id}`.
    *   `400 Bad Request`: Invalid input data (e.g., missing required fields, invalid email format, invalid SSN format for `customerId`, invalid state, invalid zip code, invalid CC details). Response body contains `Error Response Object`.
        *   Example Error Codes: `invalid_input`, `missing_required_field`, `invalid_ssn_format`, `malformed_state`, `malformed_zipcode`, `invalid_credit_card`.
    *   `409 Conflict`: A customer with the provided `customerId` already exists. Response body contains `Error Response Object`.
        *   Example Error Code: `duplicate_customer`.
    *   `500 Internal Server Error`: Unexpected server error.

### 2. Get Customer by ID

*   **Description:** Retrieves the full details of a specific customer.
*   **Endpoint:** `GET /customers/{customer_id}`
*   **Path Parameters:**
    *   `customer_id` (string, required): The SSN format ID of the customer to retrieve.
*   **Responses:**
    *   `200 OK`: Customer details successfully retrieved. Response body contains the `Customer Object` (with sensitive CC details masked/omitted).
    *   `400 Bad Request`: Invalid `customer_id` format provided in the path. Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_customer_id_format`.
    *   `404 Not Found`: No customer found with the specified `customer_id`. Response body contains `Error Response Object`.
        *   Example Error Code: `customer_not_found`.
    *   `500 Internal Server Error`: Unexpected server error.

### 3. Update Customer Information

*   **Description:** Updates specific fields for an existing customer. Supports partial updates.
*   **Endpoint:** `PATCH /customers/{customer_id}`
*   **Path Parameters:**
    *   `customer_id` (string, required): The SSN format ID of the customer to update.
*   **Request Body:** `Customer Update Object` (containing only the fields to be updated).
*   **Responses:**
    *   `200 OK`: Customer successfully updated. Response body contains the updated `Customer Object` (with sensitive CC details masked/omitted).
    *   `400 Bad Request`: Invalid input data in the request body (e.g., invalid email format, invalid state, invalid zip code, invalid CC details). Response body contains `Error Response Object`.
        *   Example Error Codes: `invalid_input`, `malformed_state`, `malformed_zipcode`, `invalid_credit_card`.
    *   `400 Bad Request`: Invalid `customer_id` format provided in the path. Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_customer_id_format`.
    *   `404 Not Found`: No customer found with the specified `customer_id`. Response body contains `Error Response Object`.
        *   Example Error Code: `customer_not_found`.
    *   `500 Internal Server Error`: Unexpected server error.

### 4. Delete Customer

*   **Description:** Removes a customer from the system. (Consider soft delete vs hard delete).
*   **Endpoint:** `DELETE /customers/{customer_id}`
*   **Path Parameters:**
    *   `customer_id` (string, required): The SSN format ID of the customer to delete.
*   **Responses:**
    *   `204 No Content`: Customer successfully deleted. No response body.
    *   `400 Bad Request`: Invalid `customer_id` format provided in the path. Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_customer_id_format`.
    *   `404 Not Found`: No customer found with the specified `customer_id`. Response body contains `Error Response Object`.
        *   Example Error Code: `customer_not_found`.
    *   `500 Internal Server Error`: Unexpected server error.

### 5. List and Search Customers

*   **Description:** Retrieves a list of customers, optionally filtered by provided criteria.
*   **Endpoint:** `GET /customers`
*   **Query Parameters (Optional):**
    *   `city` (string): Filter by city.
    *   `state` (string): Filter by state abbreviation or full name.
    *   `zipCode` (string): Filter by zip code.
    *   `min_rating` (number): Filter customers with rating >= this value.
    *   `limit` (integer, default: 20): Maximum number of results to return (for pagination).
    *   `offset` (integer, default: 0): Number of results to skip (for pagination).
*   **Responses:**
    *   `200 OK`: Successfully retrieved list of customers. Response body contains a JSON array of `Customer Object`s (with sensitive CC details masked/omitted) matching the criteria. The array might be empty if no customers match. Include pagination headers if implemented (e.g., `X-Total-Count`).
    *   `400 Bad Request`: Invalid format for query parameters (e.g., non-numeric `min_rating`). Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_query_parameter`.
    *   `500 Internal Server Error`: Unexpected server error.

### 6. Upload Image for a Ride Event

*   **Description:** Allows a customer to upload an image associated with a specific event during one of their rides. (**Note:** As per project requirement under Customer Module. Consider if this logically fits better under a dedicated Ride Service in a real-world scenario).
*   **Endpoint:** `POST /customers/{customer_id}/rides/{ride_id}/images`
*   **Content-Type:** `multipart/form-data`
*   **Path Parameters:**
    *   `customer_id` (string, required): The SSN format ID of the customer uploading the image. Must match the authenticated user.
    *   `ride_id` (string, required): The ID of the ride the image relates to. The customer must be associated with this ride.
*   **Request Body:** Form data containing the image file (e.g., under a key named `image`).
*   **Responses:**
    *   `201 Created`: Image successfully uploaded and associated with the ride event. Response body contains `Image Upload Response Object`.
    *   `400 Bad Request`: Invalid `customer_id` or `ride_id` format, or missing image file in the request. Response body contains `Error Response Object`.
        *   Example Error Codes: `invalid_customer_id_format`, `invalid_ride_id_format`, `missing_image_file`.
    *   `403 Forbidden`: Authenticated customer does not match `customer_id` in the path or is not associated with the specified `ride_id`.
    *   `404 Not Found`: No customer or ride found with the specified IDs. Response body contains `Error Response Object`.
        *   Example Error Code: `customer_not_found`, `ride_not_found`.
    *   `500 Internal Server Error`: Unexpected server error during file processing or storage.

---

## Validation Notes

*   **SSN Format:** All `customerId` and `driverId` fields must strictly adhere to the `xxx-xx-xxxx` format.
*   **State:** State fields must be validated against a list of valid US state abbreviations or full names. Return `malformed_state` error if invalid.
*   **Zip Code:** Zip code fields must adhere to `xxxxx` or `xxxxx-xxxx` format. Return `malformed_zipcode` error if invalid.
*   **Email:** Email fields should undergo basic format validation.
*   **Credit Card:** Validate expiry date (not in the past). **Crucially, implement secure handling (tokenization, etc.) in a real system and avoid storing raw card numbers and CVVs.** For simulation, ensure basic format checks if storing temporarily. Return `invalid_credit_card` error for validation failures.
*   **Rating:** Numeric ratings should be within the valid range (e.g., 1.0 to 5.0).

## Security Considerations

*   **Credit Card Data:** Storing raw Credit Card Numbers and CVVs is **highly insecure and violates PCI DSS compliance**. In a production environment, use a third-party payment processor and store only tokens or non-sensitive identifiers (like last 4 digits and card type). The API responses should *never* return full card numbers or CVVs. The provided data structures reflect simulation needs but must be adapted for real-world security.
*   **Authentication/Authorization:** Ensure all endpoints are protected and that users can only access/modify their own data (or have appropriate admin privileges). For example, a customer should not be able to update another customer's profile. The image upload endpoint specifically needs checks to ensure the uploader is the customer associated with the ride.