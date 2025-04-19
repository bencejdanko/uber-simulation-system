# Authentication Service API Documentation

**Version:** 1.1
**Base URL:** `/api/v1/auth`
**Content-Type:** `application/json`
**Authentication:** Endpoints specify if authentication (via Bearer `accessToken`) is required. Login/Register are public.

## Overview

The Authentication Service manages user identities (Customers and Drivers), validates credentials, and issues session authentication tokens (JWTs). It handles user registration and login, acting as the central authority for user authentication within the platform. This version uses a simplified single-token strategy, issuing only access tokens that represent the user's session.

**Key Change (v1.1):** Refresh tokens have been removed to simplify the authentication flow. A single, longer-lived `accessToken` is issued upon login or registration, which serves as the session token.

---

## Data Structures

### Registration Request (Customer)

Used in the request body for `POST /register/customer`.

```json
{
  "loginId": "string (e.g., email format or unique username)", // Required, must be unique. **RECOMMENDATION: Avoid SSN.**
  "firstName": "string", // Required for initial profile creation trigger
  "lastName": "string", // Required for initial profile creation trigger
  "email": "string (email format)", // Required, must be unique (often same as loginId)
  "password": "string (meets complexity requirements)", // Required
  "phoneNumber": "string" // Required for initial profile creation trigger
  // Optional: Include Address fields if customer profile needs them immediately
  // "address": { ... } // See Customer Service Docs
}
```
*(**Note:** Renamed `userId` to `loginId` to strongly discourage SSN usage. `email` might be a suitable `loginId`.)*

### Registration Request (Driver)

Used in the request body for `POST /register/driver`.

```json
{
  "loginId": "string (e.g., email format or unique username)", // Required, must be unique. **RECOMMENDATION: Avoid SSN.**
  "firstName": "string", // Required for initial profile creation trigger
  "lastName": "string", // Required for initial profile creation trigger
  "email": "string (email format)", // Required, must be unique (often same as loginId)
  "password": "string (meets complexity requirements)", // Required
  "phoneNumber": "string" // Required for initial profile creation trigger
  // Clarify if Address/CarDetails are *required* at registration or can be added later
  // "address": { ... }, // See Driver Service Docs - Likely Required
  // "carDetails": { ... } // See Driver Service Docs - Likely Required
}
```
*(**Note:** Renamed `userId` to `loginId`.)*

### Login Request

Used in the request body for `POST /login`.

```json
{
  "loginId": "string (e.g., email format or unique username)", // Required
  "password": "string" // Required
}
```
*(**Note:** Renamed `userId` to `loginId`.)*

### Token Response Object (Simplified)

Standard response format upon successful login or registration.

```json
{
  "accessToken": "string (JWT)", // JWT representing the user's session
  "tokenType": "Bearer",
  "expiresIn": "integer (seconds until access token expires)" // e.g., 28800 (8 hours)
}
```
*(**Note:** Removed `refreshToken`. `expiresIn` now refers to the session duration.)*

### Error Response Object

Standard format for error responses.

```json
{
  "error": "string (error code, e.g., 'invalid_credentials', 'user_exists', 'invalid_token', 'invalid_input')",
  "message": "string (detailed error message)"
}
```

---

## Endpoints

### 1. Register Customer

*   **Description:** Creates a new customer identity and credentials. Triggers asynchronous creation of the basic customer profile. Logs the user in immediately.
*   **Endpoint:** `POST /register/customer`
*   **Request Body:** `Registration Request (Customer)`
*   **Authentication Required:** No
*   **Responses:**
    *   `201 Created`: User identity created successfully. Response body contains the simplified `Token Response Object`.
    *   `400 Bad Request`: Invalid input data (e.g., missing fields, invalid format, weak password). Response body contains `Error Response Object`.
        *   Example Error Codes: `invalid_input`, `missing_required_field`, `invalid_loginid_format`, `invalid_email_format`, `password_too_weak`.
    *   `409 Conflict`: A user with the provided `loginId` or `email` already exists. Response body contains `Error Response Object`.
        *   Example Error Code: `loginid_exists`, `email_exists`.
    *   `500 Internal Server Error`: Unexpected server error (e.g., database issue, Kafka publish failure).

### 2. Register Driver

*   **Description:** Creates a new driver identity and credentials. Triggers asynchronous creation of the basic driver profile. Logs the user in immediately. May require more initial data than customer registration.
*   **Endpoint:** `POST /register/driver`
*   **Request Body:** `Registration Request (Driver)`
*   **Authentication Required:** No
*   **Responses:**
    *   `201 Created`: User identity created successfully. Response body contains the simplified `Token Response Object`.
    *   `400 Bad Request`: Invalid input data (e.g., missing required fields including address/car details if mandated here, invalid formats, weak password). Response body contains `Error Response Object`.
        *   Example Error Codes: `invalid_input`, `missing_required_field`, `invalid_loginid_format`, `invalid_email_format`, `password_too_weak`, `malformed_address`, `missing_car_details`.
    *   `409 Conflict`: A user with the provided `loginId` or `email` already exists. Response body contains `Error Response Object`.
        *   Example Error Code: `loginid_exists`, `email_exists`.
    *   `500 Internal Server Error`: Unexpected server error.

### 3. Login User

*   **Description:** Authenticates an existing user with their credentials (`loginId` and `password`) and issues a new session `accessToken`.
*   **Endpoint:** `POST /login`
*   **Request Body:** `Login Request`
*   **Authentication Required:** No
*   **Responses:**
    *   `200 OK`: Login successful. Response body contains the simplified `Token Response Object`.
    *   `400 Bad Request`: Invalid input format (e.g., missing fields). Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_input`.
    *   `401 Unauthorized`: Invalid credentials provided (`loginId` not found or password incorrect). Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_credentials`.
    *   `500 Internal Server Error`: Unexpected server error.

---

## Service Interactions and Flows

### Registration Flow:

1.  Client sends `POST /register/customer` or `POST /register/driver` to the Gateway.
2.  Gateway applies rate limiting and routes the request to `POST /api/v1/auth/register/...` on the **Auth Service**.
3.  Auth Service validates input, checks for duplicates (`loginId`, `email`), hashes the password, and creates the user identity record (associating a unique internal ID, e.g., UUID, with the `loginId`).
4.  Auth Service generates a single JWT `accessToken`.
5.  Auth Service publishes a `user.registered` event to Kafka.
    *   **Topic:** `user.registered`
    *   **Event Type:** `USER_REGISTERED`
    *   **Payload:** `{ "internalUserId": "uuid", "loginId": "...", "userType": "CUSTOMER" | "DRIVER", "email": "...", "firstName": "...", "lastName": "...", "phoneNumber": "...", /* + other necessary initial fields */ }` *(Note: using `internalUserId`)*
6.  Auth Service sends `201 Created` with the simplified `Token Response Object` back to the Gateway, then to the Client.
7.  **Asynchronously:** The **Customer Service** or **Driver Service** consumes the `user.registered` event from Kafka. Using the `internalUserId` and payload, it creates the corresponding initial profile in its own database.

### Login Flow:

1.  Client sends `POST /login` with credentials to the Gateway.
2.  Gateway applies rate limiting and routes to `POST /api/v1/auth/login` on the **Auth Service**.
3.  Auth Service finds the user by `loginId`, verifies the hashed password.
4.  If valid, Auth Service generates a new JWT `accessToken`.
5.  Auth Service sends `200 OK` with the simplified `Token Response Object` back to the Gateway, then to the Client.
6.  Client now uses the received `accessToken` in the `Authorization: Bearer <token>` header for subsequent requests until it expires.

### Authenticated Request Flow (e.g., `GET /drivers/{id}`):

1.  Client sends `GET /drivers/{id}` with `Authorization: Bearer <accessToken>` header to the Gateway.
2.  **API Gateway:**
    *   Validates the `accessToken` (signature, expiration, issuer).
    *   *If valid:* Extracts `internalUserId` (from `sub` claim), `roles`, etc., from the token. Optionally passes these in trusted headers (e.g., `X-User-ID`, `X-User-Roles`) to the backend. Routes request to `GET /api/v1/drivers/{id}` on the **Driver Service**.
    *   *If invalid/expired:* Responds immediately with `401 Unauthorized`.
3.  **Driver Service:**
    *   Receives the request (trusting the Gateway validated the token).
    *   Uses the `internalUserId` and `roles` (from headers or token) to perform *authorization* (e.g., "Is the requesting user the owner of this profile OR an ADMIN?").
    *   If authorized, processes the request and returns data.
    *   If not authorized, returns `403 Forbidden`.

---

## API Gateway Responsibilities (Auth Service Specific)

*   **Routing:** Directs `/api/v1/auth/*` requests to the Auth Service.
*   **Authentication/Authorization:** Validates the `accessToken` for all protected endpoints across the platform. *Does NOT perform token validation* for public `/login` or `/register` endpoints.
*   **Rate Limiting:** **CRITICAL**. Apply strict rate limits to `/login` and `/register` endpoints based on IP address and potentially `loginId` on login attempts to prevent brute-force attacks and registration spam.
*   **Request/Response Transformation:** Minimal for auth routes. May inject user identity info from valid tokens into headers for downstream services.

---

## Kafka Topic Interaction

*   **Topics Produced:**
    *   `user.registered`: On successful registration (`POST /register/...`). Contains `internalUserId`, `userType`, and initial profile data. Consumed by Customer/Driver services.
*   **Topics Consumed:** None directly impacting endpoint functionality.