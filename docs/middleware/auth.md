# Authentication Service API Documentation

**Version:** 1.0
**Base URL:** `/api/v1/auth`
**Content-Type:** `application/json`
**Authentication:** Endpoints specify if authentication (e.g., via Refresh Token) is required. Login/Register are public.

## Overview

The Authentication Service is responsible for managing user identities, credentials, and issuing authentication tokens (JWTs) for the platform. It handles registration of new users (Customers and Drivers), validates credentials for login, and provides mechanisms for token refreshing. It acts as the central authority for user authentication.

---

## Data Structures

### Registration Request (Customer)

Used in the request body for `POST /register/customer`.

```json
{
  "userId": "string (SSN Format: xxx-xx-xxxx)", // Required, must be unique
  "firstName": "string", // Required for initial profile creation trigger
  "lastName": "string", // Required for initial profile creation trigger
  "email": "string (email format)", // Required, must be unique
  "password": "string (meets complexity requirements)", // Required
  "phoneNumber": "string" // Required for initial profile creation trigger
  // Optional: Include Address fields if customer profile needs them immediately
  // "address": { ... } // See Customer Service Docs
}
```

### Registration Request (Driver)

Used in the request body for `POST /register/driver`.

```json
{
  "userId": "string (SSN Format: xxx-xx-xxxx)", // Required, must be unique
  "firstName": "string", // Required for initial profile creation trigger
  "lastName": "string", // Required for initial profile creation trigger
  "email": "string (email format)", // Required, must be unique
  "password": "string (meets complexity requirements)", // Required
  "phoneNumber": "string" // Required for initial profile creation trigger
  // Driver registration might require more upfront details for the Driver profile
  // "address": { ... }, // See Driver Service Docs - Likely Required
  // "carDetails": { ... } // See Driver Service Docs - Likely Required
}
```

### Login Request

Used in the request body for `POST /login`.

```json
{
  "userId": "string (SSN Format: xxx-xx-xxxx)", // Required
  "password": "string" // Required
}
```

### Refresh Request

Used in the request body for `POST /refresh`.

```json
{
  "refreshToken": "string (The Refresh Token previously issued)" // Required
}
```

### Token Response Object

Standard response format upon successful login, registration, or refresh.

```json
{
  "accessToken": "string (JWT)", // Short-lived JWT for API access
  "refreshToken": "string (JWT or Opaque Token)", // Longer-lived token to get new access tokens
  "tokenType": "Bearer",
  "expiresIn": "integer (seconds until access token expires)" // e.g., 3600
}
```

### Error Response Object

Standard format for error responses.

```json
{
  "error": "string (error code, e.g., 'invalid_credentials', 'user_exists', 'invalid_token')",
  "message": "string (detailed error message)"
}
```

---

## Endpoints

### 1. Register Customer

*   **Description:** Creates a new customer identity and credentials. Triggers asynchronous creation of the basic customer profile.
*   **Endpoint:** `POST /register/customer`
*   **Request Body:** `Registration Request (Customer)`
*   **Authentication Required:** No
*   **Responses:**
    *   `201 Created`: User identity created successfully. Response body contains `Token Response Object` (user is logged in immediately).
    *   `400 Bad Request`: Invalid input data (e.g., missing fields, invalid SSN/email format, weak password). Response body contains `Error Response Object`.
        *   Example Error Codes: `invalid_input`, `missing_required_field`, `invalid_userid_format`, `invalid_email_format`, `password_too_weak`.
    *   `409 Conflict`: A user with the provided `userId` or `email` already exists. Response body contains `Error Response Object`.
        *   Example Error Code: `user_exists`, `email_exists`.
    *   `500 Internal Server Error`: Unexpected server error (e.g., database issue, Kafka publish failure).

### 2. Register Driver

*   **Description:** Creates a new driver identity and credentials. Triggers asynchronous creation of the basic driver profile. Requires more initial data than customer registration.
*   **Endpoint:** `POST /register/driver`
*   **Request Body:** `Registration Request (Driver)`
*   **Authentication Required:** No
*   **Responses:**
    *   `201 Created`: User identity created successfully. Response body contains `Token Response Object`.
    *   `400 Bad Request`: Invalid input data (e.g., missing fields including address/car details if required here, invalid formats, weak password). Response body contains `Error Response Object`.
        *   Example Error Codes: `invalid_input`, `missing_required_field`, `invalid_userid_format`, `invalid_email_format`, `password_too_weak`, `malformed_address`, `missing_car_details`.
    *   `409 Conflict`: A user with the provided `userId` or `email` already exists. Response body contains `Error Response Object`.
        *   Example Error Code: `user_exists`, `email_exists`.
    *   `500 Internal Server Error`: Unexpected server error.

### 3. Login User

*   **Description:** Authenticates an existing user with their credentials (`userId` and `password`) and issues new tokens.
*   **Endpoint:** `POST /login`
*   **Request Body:** `Login Request`
*   **Authentication Required:** No
*   **Responses:**
    *   `200 OK`: Login successful. Response body contains `Token Response Object`.
    *   `400 Bad Request`: Invalid input format (e.g., missing fields). Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_input`.
    *   `401 Unauthorized`: Invalid credentials provided (`userId` not found or password incorrect). Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_credentials`.
    *   `500 Internal Server Error`: Unexpected server error.

### 4. Refresh Token

*   **Description:** Issues a new short-lived `accessToken` using a valid `refreshToken`.
*   **Endpoint:** `POST /refresh`
*   **Request Body:** `Refresh Request`
*   **Authentication Required:** Implicitly, via the `refreshToken` itself. No Bearer token needed.
*   **Responses:**
    *   `200 OK`: Token refresh successful. Response body contains a *new* `Token Response Object` (potentially including a new `refreshToken` depending on rotation strategy).
    *   `400 Bad Request`: Missing `refreshToken` in the request. Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_input`.
    *   `401 Unauthorized`: The provided `refreshToken` is invalid, expired, or revoked. Response body contains `Error Response Object`.
        *   Example Error Code: `invalid_token`, `token_expired`.
    *   `500 Internal Server Error`: Unexpected server error.

*(Note: Admin registration is assumed to be handled via a separate internal process or an admin-specific endpoint not exposed publicly, potentially requiring existing admin credentials).*

---

## Service Interactions and Flows

### Registration Flow:

1.  Client sends `POST /register/customer` or `POST /register/driver` to the Gateway.
2.  Gateway applies rate limiting and routes the request to `POST /api/v1/auth/register/...` on the **Auth Service**.
3.  Auth Service validates input, checks for duplicates, hashes the password, and creates the user identity record in its *own database*.
4.  Auth Service generates JWT Access and Refresh Tokens.
5.  Auth Service publishes a `user.registered` event to Kafka.
    *   **Topic:** `user.registered`
    *   **Event Type:** `USER_REGISTERED`
    *   **Payload:** `{ "userId": "xxx-xx-xxxx", "userType": "CUSTOMER" | "DRIVER", "email": "...", "firstName": "...", "lastName": "...", "phoneNumber": "...", /* + other necessary initial fields */ }`
6.  Auth Service sends `201 Created` with the `Token Response Object` back to the Gateway, then to the Client.
7.  **Asynchronously:** The **Customer Service** or **Driver Service** consumes the `user.registered` event from Kafka. Based on the `userType` and payload, it creates the corresponding initial profile (Customer or Driver) in its own database.

### Login Flow:

1.  Client sends `POST /login` with credentials to the Gateway.
2.  Gateway applies rate limiting and routes to `POST /api/v1/auth/login` on the **Auth Service**.
3.  Auth Service finds the user by `userId`, verifies the hashed password.
4.  If valid, Auth Service generates new JWT Access and Refresh Tokens.
5.  Auth Service sends `200 OK` with the `Token Response Object` back to the Gateway, then to the Client.
6.  Client now uses the received `accessToken` in the `Authorization: Bearer <token>` header for subsequent requests to other services (Driver, Customer, Rides, etc.).

### Authenticated Request Flow (e.g., `GET /drivers/{id}`):

1.  Client sends `GET /drivers/{id}` with `Authorization: Bearer <accessToken>` header to the Gateway.
2.  **API Gateway:**
    *   Validates the `accessToken` (signature, expiration, issuer).
    *   *If valid:* Extracts `userId` and `roles` from the token. Optionally passes these in trusted headers (e.g., `X-User-ID`, `X-User-Roles`) to the backend. Routes request to `GET /api/v1/drivers/{id}` on the **Driver Service**.
    *   *If invalid:* Responds immediately with `401 Unauthorized`.
3.  **Driver Service:**
    *   Receives the request (trusting the Gateway validated the token).
    *   Uses the `userId` and `roles` (from headers or token) to perform *authorization* (e.g., "Is the requesting user the owner of this profile OR an ADMIN?").
    *   If authorized, processes the request and returns data.
    *   If not authorized, returns `403 Forbidden`.

---

## API Gateway Responsibilities (Auth Service Specific)

*   **Routing:** Directs `/api/v1/auth/*` requests to the Auth Service.
*   **Authentication/Authorization:** *Does NOT perform token validation* for public `/login` or `/register` endpoints. For `/refresh`, it passes the request through; the Auth Service validates the refresh token.
*   **Rate Limiting:** **CRITICAL**. Apply strict rate limits to `/login` and `/register` endpoints based on IP address and potentially `userId` on login attempts to prevent brute-force attacks and registration spam.
*   **Request/Response Transformation:** Minimal.

---

## Kafka Topic Interaction

*   **Topics Produced:**
    *   `user.registered`: On successful registration (`POST /register/...`). Contains `userId`, `userType`, and initial profile data. Consumed by Customer/Driver services.
*   **Topics Consumed:** None directly impacting endpoint functionality.

---

## Security Considerations

*   **Password Hashing:** Passwords MUST be securely hashed (e.g., using bcrypt, Argon2) before storing. Never store plain text passwords.
*   **Token Lifespans:** Use short lifespans for `accessToken` (e.g., 15-60 minutes) and longer lifespans for `refreshToken` (e.g., days or weeks).
*   **Refresh Token Storage:** `refreshToken` should be stored securely by the client. Using HttpOnly, Secure cookies is often recommended for web clients to mitigate XSS attacks.
*   **HTTPS:** All communication must be over HTTPS.
*   **Input Validation:** Rigorously validate all inputs (formats, lengths, required fields).
*   **Rate Limiting:** Essential to prevent abuse.
*   **JWT Claims:** Include necessary claims (`sub`, `roles`, `exp`, `iss`, `iat`) in the `accessToken` for stateless authorization checks by backend services/Gateway. Keep payload size reasonable.
