# Middleware Route-Specific Analysis

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

## I. Route-Specific Analysis (Driver Service)

This section analyzes each endpoint defined in the Driver Service API documentation.

### 1. `POST /drivers`

1.  **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Driver Service at `/api/v1/drivers`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. Based on the Auth Service flow, this endpoint might be called asynchronously *by the Driver Service itself* after consuming a `user.registered` Kafka event, or potentially by an Admin, or by the user post-initial registration. The Gateway *must* enforce authentication. Authorization logic depends on the exact trigger:
        *   If Admin creation: Verify token has 'ADMIN' role.
        *   If user completion post-auth: Verify token `userId` matches the `driverId` in the payload.
        *   If internal service call: May use service-to-service auth or trust internal network. For external exposure, treat as Admin/User case.
    *   **Rate Limiting:** Yes, apply moderate rate limiting per user/source IP to prevent abuse or bulk creation attempts.
    *   **Request/Response Transformation:** Minimal. Potentially add standard headers like `X-Request-ID`.

2.  **Kafka Topic Interaction:**
    *   **Topics Produced:** Yes. On successful driver creation.
        *   Topic Name(s): `driver.profile.created`
        *   Event Type/Purpose: `PROFILE_CREATED`
        *   Key Payload Fields: `driverId`, `firstName`, `lastName`, `email`, `phoneNumber`, `carDetails`, `address`, `createdAt`.
    *   **Topics Consumed:** No, not directly for serving the synchronous API request. *However*, the Driver Service *likely consumes* the `user.registered` event from the Auth Service (Topic: `user.registered`, Type: `USER_REGISTERED`) to initiate the driver profile creation process asynchronously, potentially triggering logic similar to this endpoint internally.

3.  **Client Update Mechanism:**
    *   **Primary Response:** Synchronous `201 Created` HTTP Response containing the created `Driver Object`. Includes a `Location` header.
    *   **Subsequent/Asynchronous Updates:** If creation triggers downstream processes (e.g., background checks), the client might need to poll `GET /drivers/{driver_id}` or a dedicated status endpoint, or listen via WebSockets/SSE for status update events (e.g., `driver.verification.status.updated`) if such events are defined.

4.  **Caching Strategy:**
    *   **Gateway Caching:** No. POST requests are not cacheable.
    *   **Service-Level Caching:** Yes. The Driver Service should cache the newly created driver profile (e.g., in Redis) for faster subsequent reads.
    *   **CDN Caching:** No.

### 2. `GET /drivers/{driver_id}`

1.  **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Driver Service at `/api/v1/drivers/{driver_id}`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. Authorization: Verify that the `userId` claim in the token matches the `{driver_id}` path parameter OR that the user has an 'ADMIN' role.
    *   **Rate Limiting:** Yes. Apply rate limiting per user and/or per IP address.
    *   **Request/Response Transformation:** Minimal.

2.  **Kafka Topic Interaction:**
    *   **Topics Produced:** No.
    *   **Topics Consumed:** No, not for serving the synchronous request.

3.  **Client Update Mechanism:**
    *   **Primary Response:** Synchronous `200 OK` HTTP Response containing the `Driver Object`.
    *   **Subsequent/Asynchronous Updates:** No further updates expected for this specific GET request. If the client needs real-time updates (e.g., location), they must use a different mechanism like subscribing to location updates via WebSockets/SSE.

4.  **Caching Strategy:**
    *   **Gateway Caching:** Yes. Cacheable with a short TTL (e.g., 30-60 seconds) due to potentially changing fields like `currentLocation` or `rating`. The cache key should include the `driver_id` and potentially vary based on the authenticated user if authorization rules affect the response content (though unlikely for this object structure). Invalidation is needed after `PATCH` or `DELETE`.
    *   **Service-Level Caching:** Yes. The Driver Service should definitely cache driver profiles (e.g., in Redis) to reduce database load.
    *   **CDN Caching:** Unlikely due to authentication requirements and Personally Identifiable Information (PII).

### 3. `PATCH /drivers/{driver_id}`

1.  **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Driver Service at `/api/v1/drivers/{driver_id}`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. Authorization: Verify that the `userId` claim in the token matches the `{driver_id}` path parameter OR that the user has an 'ADMIN' role.
    *   **Rate Limiting:** Yes. Apply moderate rate limiting per user/IP.
    *   **Request/Response Transformation:** Minimal.

2.  **Kafka Topic Interaction:**
    *   **Topics Produced:** Yes. On successful update.
        *   Topic Name(s): `driver.profile.updated`
        *   Event Type/Purpose: `PROFILE_UPDATED`
        *   Key Payload Fields: `driverId`, updated fields (e.g., `address`, `carDetails`), `updatedAt`.
    *   **Topics Consumed:** No, not for serving the synchronous request.

3.  **Client Update Mechanism:**
    *   **Primary Response:** Synchronous `200 OK` HTTP Response containing the updated `Driver Object`.
    *   **Subsequent/Asynchronous Updates:** The calling client gets the direct result. Other clients/services interested in profile changes would consume the `driver.profile.updated` event (e.g., via a WebSocket/SSE bridge if UI updates are needed).

4.  **Caching Strategy:**
    *   **Gateway Caching:** No. PATCH requests are not cacheable. The Gateway *must invalidate* any cached `GET /drivers/{driver_id}` responses upon successful PATCH.
    *   **Service-Level Caching:** Yes. The Driver Service must update its cache after successfully updating the database.
    *   **CDN Caching:** No.

### 4. `DELETE /drivers/{driver_id}`

1.  **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Driver Service at `/api/v1/drivers/{driver_id}`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. Authorization: Likely requires an 'ADMIN' role. Self-deletion might be possible, requiring verification that the token `userId` matches the `{driver_id}`. Policy needs clarification.
    *   **Rate Limiting:** Yes. Apply stricter rate limiting due to the destructive nature of the operation.
    *   **Request/Response Transformation:** Minimal.

2.  **Kafka Topic Interaction:**
    *   **Topics Produced:** Yes. On successful deletion (or soft deletion).
        *   Topic Name(s): `driver.profile.deleted`
        *   Event Type/Purpose: `PROFILE_DELETED`
        *   Key Payload Fields: `driverId`, `deletedAt` (if soft delete).
    *   **Topics Consumed:** No, not for serving the synchronous request.

3.  **Client Update Mechanism:**
    *   **Primary Response:** Synchronous `204 No Content` HTTP Response.
    *   **Subsequent/Asynchronous Updates:** Other services consuming the `driver.profile.deleted` event might perform cleanup actions. The original client receives no further updates.

4.  **Caching Strategy:**
    *   **Gateway Caching:** No. DELETE requests are not cacheable. The Gateway *must invalidate* any cached `GET /drivers/{driver_id}` responses upon successful DELETE.
    *   **Service-Level Caching:** Yes. The Driver Service must remove the driver's profile from its cache after successful deletion/soft-deletion in the database.
    *   **CDN Caching:** No.

### 5. `GET /drivers` (List/Search)

1.  **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Driver Service at `/api/v1/drivers`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. Authorization: Likely requires an 'ADMIN' role, as general customer searching for drivers seems handled by `GET /drivers/nearby` in the Rides service. If specific non-admin use cases exist, roles/permissions need to be checked.
    *   **Rate Limiting:** Yes. Apply rate limiting, potentially stricter if queries can be resource-intensive (e.g., searches across large datasets without good indexing).
    *   **Request/Response Transformation:** Minimal.

2.  **Kafka Topic Interaction:**
    *   **Topics Produced:** No.
    *   **Topics Consumed:** No, not for serving the synchronous request.

3.  **Client Update Mechanism:**
    *   **Primary Response:** Synchronous `200 OK` HTTP Response containing a JSON array of `Driver Object`s matching the query parameters.
    *   **Subsequent/Asynchronous Updates:** No updates expected for this specific list/search request.

4.  **Caching Strategy:**
    *   **Gateway Caching:** Potentially yes, for common, repeatable search queries *if* data doesn't change too rapidly and authorization permits (less likely for admin-level searches). Cache key must include all relevant query parameters. Short TTL.
    *   **Service-Level Caching:** Yes. The Driver Service can cache results for frequently used filter combinations to improve performance.
    *   **CDN Caching:** No.

### 6. `PATCH /drivers/{driver_id}/location`

1.  **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Driver Service at `/api/v1/drivers/{driver_id}/location`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. Authorization: Verify that the `userId` claim in the token matches the `{driver_id}` path parameter. Only the driver should update their own location via this endpoint.
    *   **Rate Limiting:** **Yes, Critical**. This endpoint will receive frequent updates (potentially every few seconds) from active drivers. Implement rate limiting per `driver_id` (or user token) to prevent abuse and manage load.
    *   **Request/Response Transformation:** Minimal.

2.  **Kafka Topic Interaction:**
    *   **Topics Produced:** Yes. On successful location update.
        *   Topic Name(s): `driver.location.updated`
        *   Event Type/Purpose: `LOCATION_UPDATE`
        *   Key Payload Fields: `driverId`, `latitude`, `longitude`, `timestamp`.
    *   **Topics Consumed:** No, not for serving the synchronous request.

3.  **Client Update Mechanism:**
    *   **Primary Response:** Synchronous `200 OK` or `204 No Content` HTTP Response. A `204 No Content` is often preferred for high-frequency updates where the response body isn't needed.
    *   **Subsequent/Asynchronous Updates:** This action's primary purpose is to update the system state for consumption by *other* services (e.g., Rides Service for matching) via the Kafka event. *Other clients* needing this location data (e.g., a customer tracking their assigned driver) would typically subscribe to location updates for the specific `driverId` via WebSockets or Server-Sent Events (SSE), which would be fed by consumers of the `driver.location.updated` Kafka topic.

4.  **Caching Strategy:**
    *   **Gateway Caching:** No. Location data is highly volatile and updated via PATCH.
    *   **Service-Level Caching:** Yes. The Driver Service *must* cache the latest known location for each driver (e.g., in Redis or a dedicated geospatial cache) for fast lookups by other services (like the Rides service matching algorithm). This cache is updated by this endpoint.
    *   **CDN Caching:** No.

---

## II. Service-Wide Analysis (Driver Service)

This section covers overall considerations for the Driver Service interacting with the API Gateway.

1.  **Signup Flow (Driver Service Specifics):**
    *   The primary signup initiation occurs via the **Auth Service** (`POST /auth/register/driver`), as detailed in `<auth-docs>`.
    *   **Synchronous Steps (Auth Service):** Gateway routes `/auth/register/driver` -> Auth Service validates input (SSN format, email, password complexity, required fields like name, phone, potentially address/car details if required upfront), checks for duplicate `userId`/`email`, hashes password, stores credentials, generates JWTs. Auth Service responds `201 Created` with tokens.
    *   **Asynchronous Steps (Post-Auth Success):**
        *   Auth Service publishes `user.registered` event to Kafka.
            *   Topic: `user.registered`
            *   Purpose: Signal new user registration.
            *   Payload includes: `userId` (SSN format), `userType: "DRIVER"`, `email`, `firstName`, `lastName`, `phoneNumber`, potentially `address`, `carDetails` if collected during Auth registration.
        *   **Driver Service** consumes the `user.registered` event.
        *   Driver Service performs internal processing triggered by the event:
            *   Validates the data received in the event payload.
            *   Performs critical Driver Service validations (see below).
            *   Creates the full driver profile record in its own database.
            *   *May* publish the `driver.profile.created` event (as detailed in `POST /drivers` analysis) upon successful internal creation.
    *   **Key Validations (Performed by Driver Service upon consuming `user.registered` event or if `POST /drivers` is called directly):**
        *   Strict SSN Format (`driverId`).
        *   Required Fields: `firstName`, `lastName`, `address` (all fields within), `phoneNumber`, `email`, `carDetails` (all fields within).
        *   Format/Value Validation: Valid US State (abbreviation or full name), Zip Code format (`xxxxx` or `xxxxx-xxxx`), Email format.
        *   Uniqueness Check: Ensure `driverId` does not already exist in the Driver Service database (should be guaranteed by Auth service uniqueness check, but defensive check is good).

2.  **Authentication & Authorization Strategy (Overall):**
    *   **Mechanism:** Bearer Token (JWT) issued by the Auth Service is required for *all* Driver Service endpoints, as specified in the documentation.
    *   **Gateway Role:** The API Gateway is responsible for:
        *   Verifying the presence of the `Authorization: Bearer <token>` header.
        *   Validating the JWT signature against the Auth Service's public key.
        *   Validating standard claims like expiration (`exp`), issuer (`iss`).
        *   If valid, potentially extracting key claims (`userId`, `roles`) and passing them securely to the Driver Service (e.g., via trusted headers like `X-User-ID`, `X-User-Roles`).
        *   Rejecting requests with invalid/expired/missing tokens with a `401 Unauthorized` response *before* they reach the Driver Service.
    *   **Service Role:** The Driver Service trusts that the Gateway has performed initial token validation. Its responsibilities are:
        *   Using the provided claims (`userId`, `roles`) to perform *authorization* checks specific to the requested resource and action.
        *   Examples:
            *   `GET/PATCH/DELETE /drivers/{driver_id}`: Check if `userId` from token matches `{driver_id}` OR if `roles` contains 'ADMIN'.
            *   `PATCH /drivers/{driver_id}/location`: Check if `userId` from token matches `{driver_id}`.
            *   `GET /drivers` (List/Search): Check if `roles` contains 'ADMIN'.
        *   Returning `403 Forbidden` if authentication is valid but authorization fails.

3.  **Validation Strategy (Overall):**
    *   **Gateway Validation:** Minimal validation can be performed at the Gateway:
        *   Check for expected `Content-Type: application/json` header for POST/PATCH requests.
        *   Basic format check of path parameters (e.g., ensuring `{driver_id}` roughly matches the `xxx-xx-xxxx` pattern using regex, though the service must do the definitive check).
        *   Enforce request size limits.
    *   **Service Validation:** The **Driver Service** is responsible for comprehensive business logic validation as described in the API documentation ("Validation Notes" and data structure definitions):
        *   **Format Adherence:** SSN (`driverId`), State (vs. known list), Zip Code (patterns), Email, Phone Number (if standardized).
        *   **Required Fields:** Presence checks for all required fields in POST requests and relevant fields in PATCH requests based on the DTOs.
        *   **Data Types & Ranges:** Correct data types (string, number, integer), number ranges (e.g., `rating` 1.0-5.0).
        *   **Existence Checks:** For `GET/PATCH/DELETE /drivers/{driver_id}`, verify that a driver with the given ID actually exists before proceeding.
        *   **Duplicate Checks:** Ensure `driverId` is unique upon creation (`POST /drivers` or internal handling of `user.registered` event).
        *   **Cross-field Consistency:** (If applicable, though not explicitly stated in docs).

---

**I. Route-Specific Analysis (Customer Service)**

---

**1. `POST /customers` (Create Customer)**

*   **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Customer Service at `/customers`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. Extract `userId` and `roles` from the token. (Note: This endpoint seems distinct from the Auth Service's `/register/customer` flow which *triggers* profile creation via Kafka. This endpoint implies direct creation, potentially by an Admin or another authenticated system process. Requires clarification on intended use, but assume authentication is needed).
    *   **Rate Limiting:** Yes. High potential for abuse/spam. Limit by IP, and potentially by authenticated user ID if applicable (e.g., limit how many customers an admin can create per hour).
    *   **Request/Response Transformation:** Minimal. Could add trusted headers like `X-User-ID`, `X-User-Roles`. **Crucially, ensure the Gateway does NOT log raw credit card details if it inspects the body.** The response from the service should already have sensitive CC details masked.
*   **Kafka Topic Interaction:**
    *   **Topics Produced:** Yes, upon successful creation.
        *   Topic Name: `customer.profile.created`
        *   Event Type: `PROFILE_CREATED`
        *   Key Payload Fields: `customerId`, `firstName`, `lastName`, `email`, `address`, `timestamp`. (Note: Sensitive CC details should NOT be in the event).
    *   **Topics Consumed:** No. This endpoint acts synchronously based on the API request. (The *service itself* might consume `user.registered` from the Auth service asynchronously as part of the main signup flow, but this *specific endpoint* doesn't depend on it).
*   **Client Update Mechanism:**
    *   **Primary Response:** Synchronous `201 Created` HTTP response containing the created `Customer Object` (with sensitive data masked/omitted).
    *   **Subsequent/Asynchronous Updates:** Unlikely needed for the *calling* client of this specific POST. Other systems interested in new customers would consume the `customer.profile.created` Kafka event.
*   **Caching Strategy:**
    *   **Gateway Caching:** No (POST requests are not cacheable).
    *   **Service-Level Caching:** Yes, the Customer Service is likely responsible for caching customer profiles (e.g., in Redis) for faster subsequent reads.
    *   **CDN Caching:** No.

---

**2. `GET /customers/{customer_id}` (Get Customer by ID)**

*   **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Customer Service at `/customers/{customer_id}`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. Extract `userId` and `roles` (e.g., `CUSTOMER`, `ADMIN`). This is critical as the service needs this information to enforce authorization (e.g., customer can only get their own profile unless they are an ADMIN). Gateway *could* perform an initial check (e.g., `token.userId == path.customer_id || token.roles.includes('ADMIN')`) but the service *must* re-validate.
    *   **Rate Limiting:** Yes, moderate. Limit requests per `customer_id` and per requesting `userId` to prevent scraping or abuse.
    *   **Request/Response Transformation:** Minimal. Could add trusted headers like `X-User-ID`, `X-User-Roles`.
*   **Kafka Topic Interaction:**
    *   **Topics Produced:** No.
    *   **Topics Consumed:** No.
*   **Client Update Mechanism:**
    *   **Primary Response:** Synchronous `200 OK` HTTP response containing the `Customer Object` (with sensitive data masked).
    *   **Subsequent/Asynchronous Updates:** Generally no updates expected from this specific GET request. If a client application needs real-time updates (e.g., rating changes), it would typically require a WebSocket/SSE connection subscribed to specific customer-related events (e.g., `customer_rating_updated:{customer_id}`), independent of this GET request.
*   **Caching Strategy:**
    *   **Gateway Caching:** Yes, potentially, but carefully. Cache key must include `customer_id` **and** the requesting user's identity/role information (derived from the token) due to authorization rules. TTL should be short (e.g., 5-60 seconds). Caching based solely on `customer_id` is insecure.
    *   **Service-Level Caching:** Yes, highly likely. Customer profiles are prime candidates for caching in the service layer (e.g., Redis) keyed by `customerId`.
    *   **CDN Caching:** No (authenticated, personalized data).

---

**3. `PATCH /customers/{customer_id}` (Update Customer Information)**

*   **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Customer Service at `/customers/{customer_id}`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. Extract `userId` and `roles`. Critical for authorization (user can only update self, unless ADMIN). Gateway *could* perform initial auth check, but service *must* re-validate.
    *   **Rate Limiting:** Yes, moderate. Limit update frequency per `customer_id` and per user.
    *   **Request/Response Transformation:** Minimal. Add trusted headers. Be cautious about logging sensitive fields in the request body, even if the service masks them later.
*   **Kafka Topic Interaction:**
    *   **Topics Produced:** Yes, upon successful update.
        *   Topic Name: `customer.profile.updated`
        *   Event Type: `PROFILE_UPDATED`
        *   Key Payload Fields: `customerId`, updated fields (e.g., `firstName`, `address`, `phoneNumber`, `email`), `timestamp`. (Do not include sensitive CC details).
    *   **Topics Consumed:** No.
*   **Client Update Mechanism:**
    *   **Primary Response:** Synchronous `200 OK` HTTP response containing the updated `Customer Object` (masked).
    *   **Subsequent/Asynchronous Updates:** The calling client receives the immediate result. Other systems or clients needing to know about the update would consume the `customer.profile.updated` Kafka event or listen via WebSocket/SSE.
*   **Caching Strategy:**
    *   **Gateway Caching:** No (PATCH requests modify state). Must invalidate any cached `GET /customers/{customer_id}` entries for this `customer_id`.
    *   **Service-Level Caching:** Yes, the service updates its cache upon successful modification.
    *   **CDN Caching:** No.

---

**4. `DELETE /customers/{customer_id}` (Delete Customer)**

*   **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Customer Service at `/customers/{customer_id}`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. Extract `userId` and `roles`. Critical for authorization (can user delete self? Only ADMIN can delete? Define policy). Gateway *could* pre-check, service *must* re-validate.
    *   **Rate Limiting:** Yes, potentially stricter limits than updates to prevent accidental or malicious mass deletions.
    *   **Request/Response Transformation:** Minimal.
*   **Kafka Topic Interaction:**
    *   **Topics Produced:** Yes, upon successful deletion (or soft deletion).
        *   Topic Name: `customer.profile.deleted` (or `customer.profile.status.updated` if soft delete)
        *   Event Type: `PROFILE_DELETED` (or `PROFILE_DISABLED`)
        *   Key Payload Fields: `customerId`, `timestamp`.
    *   **Topics Consumed:** No.
*   **Client Update Mechanism:**
    *   **Primary Response:** Synchronous `204 No Content` HTTP response.
    *   **Subsequent/Asynchronous Updates:** Other systems react to the Kafka event (e.g., anonymize data in other services).
*   **Caching Strategy:**
    *   **Gateway Caching:** No. Must invalidate any cached `GET /customers/{customer_id}` entries.
    *   **Service-Level Caching:** Yes, the service removes or marks the entry as invalid/deleted in its cache.
    *   **CDN Caching:** No.

---

**5. `GET /customers` (List and Search Customers)**

*   **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Customer Service at `/customers`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. Extract `userId` and `roles`. **This endpoint likely requires an 'ADMIN' role.** A regular customer should generally not be able to list or search other customers. Gateway should enforce this role check before routing, responding with `403 Forbidden` if the role is missing.
    *   **Rate Limiting:** Yes, moderate. Protect against resource-intensive queries, especially if complex filtering is allowed. Limit per admin user.
    *   **Request/Response Transformation:** Minimal.
*   **Kafka Topic Interaction:**
    *   **Topics Produced:** No.
    *   **Topics Consumed:** No.
*   **Client Update Mechanism:**
    *   **Primary Response:** Synchronous `200 OK` HTTP response with a JSON array of `Customer Object`s (masked).
    *   **Subsequent/Asynchronous Updates:** No. Client uses pagination parameters (`limit`, `offset`) to fetch more data if needed.
*   **Caching Strategy:**
    *   **Gateway Caching:** Generally No. The combination of query parameters makes effective caching difficult. Cache hit ratio would likely be low unless specific, common admin queries are identified.
    *   **Service-Level Caching:** Less likely for the full query results, but the service relies heavily on efficient database indexing and potentially caches individual customer objects retrieved during the query execution.
    *   **CDN Caching:** No.

---

**6. `POST /customers/{customer_id}/rides/{ride_id}/images` (Upload Image for a Ride Event)**

*   **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Customer Service at `/customers/{customer_id}/rides/{ride_id}/images`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. Extract `userId`. **Crucial:** Gateway *should* perform an initial check: does `token.userId == path.customer_id`? If not, reject with `403 Forbidden` immediately. The Customer Service *must* still perform the definitive authorization, including checking if the customer is associated with the `ride_id`.
    *   **Rate Limiting:** Yes, critical for file uploads. Limit file size (e.g., via Gateway config), frequency of uploads per user/ride, and potentially total storage quota checks (though quota logic is likely in the service).
    *   **Request/Response Transformation:** Handle `multipart/form-data`. Potentially configure the Gateway to stream the upload directly to the service rather than buffering the entire file, especially for large files.
*   **Kafka Topic Interaction:**
    *   **Topics Produced:** Possibly, upon successful upload and storage.
        *   Topic Name: `customer.ride.image.uploaded`
        *   Event Type: `RIDE_IMAGE_UPLOADED`
        *   Key Payload Fields: `customerId`, `rideId`, `imageUrl`, `timestamp`.
    *   **Topics Consumed:** No.
*   **Client Update Mechanism:**
    *   **Primary Response:** Synchronous `201 Created` HTTP response with the `Image Upload Response Object` (containing the `imageUrl`).
    *   **Subsequent/Asynchronous Updates:** None expected for the calling client. Other systems might consume the Kafka event if produced.
*   **Caching Strategy:**
    *   **Gateway Caching:** No (POST request).
    *   **Service-Level Caching:** N/A (deals with file storage, not typical data caching).
    *   **CDN Caching:** No for the upload itself. However, the returned `imageUrl` should ideally point to a URL served by a CDN for efficient image delivery later.

---

**II. Service-Wide Analysis (Customer Service)**

**1. Signup Flow (Customer Service Specifics):**

*   The primary customer signup flow appears to be initiated via the **Auth Service** (`POST /auth/register/customer`) based on the `<auth-docs>`.
*   **Synchronous Steps (from Client perspective interacting with Auth Service):**
    1.  Client sends registration details (SSN as `userId`, email, password, name, phone) to Auth Service via Gateway.
    2.  Auth Service validates input (format, uniqueness, password strength).
    3.  Auth Service creates the identity record (stores hashed password).
    4.  Auth Service generates Access/Refresh Tokens.
    5.  Auth Service responds `201 Created` with tokens to the client.
*   **Asynchronous Steps (Post-Auth Success):**
    1.  Auth Service publishes a `user.registered` event to Kafka.
        *   **Topic:** `user.registered`
        *   **Purpose:** Signal new user creation and provide initial profile data. Payload includes `userId`, `userType: "CUSTOMER"`, `email`, `firstName`, `lastName`, `phoneNumber`, etc.
    2.  **Customer Service** (listening to Kafka) consumes the `user.registered` event where `userType` is "CUSTOMER".
    3.  Customer Service uses the event data to create the full customer profile entry in its *own database*.
*   **Key Validations (by Customer Service consuming Kafka event):**
    *   `customerId` (SSN) format (`xxx-xx-xxxx`).
    *   Duplicate check for `customerId` (event should ideally only be processed once, but defensive checks are good).
    *   Required fields from event payload (Name, Phone, Email).
    *   Format validation for `email`.
    *   Format validation for `state` and `zipCode` if included in the event payload/required for initial profile.

**2. Authentication & Authorization Strategy (Overall):**

*   **Mechanism:** Bearer Token (JWT) required for all Customer Service endpoints (except potentially health checks). Tokens are obtained via the Auth Service.
*   **Gateway Role:**
    *   Validate token presence in the `Authorization: Bearer <token>` header.
    *   Verify token signature, expiration, and issuer using the Auth Service's public key.
    *   Reject requests with invalid/expired tokens immediately (`401 Unauthorized`).
    *   Extract relevant claims (`sub` for `userId`, `roles`) and pass them securely to the Customer Service (e.g., via trusted HTTP headers like `X-User-ID`, `X-User-Roles`).
    *   *Optional but recommended:* Perform basic path-based authorization checks where possible (e.g., check if `token.userId == path.customer_id` for GET/PATCH/DELETE on `/customers/{customer_id}`, or check for `ADMIN` role on `GET /customers`).
*   **Service Role:**
    *   **Trust the Gateway's token validation.**
    *   Use the passed `userId` and `roles` for **fine-grained authorization**:
        *   Verify if the requesting user (`userId` from token) matches the resource ID (`customer_id` from path/body).
        *   Verify if the user has the necessary role (`ADMIN`) for certain actions (e.g., searching all customers via `GET /customers`).
        *   Verify specific conditions (e.g., for image upload, check if `token.userId` matches `path.customer_id` *and* if that customer is associated with the `path.ride_id`).
    *   Return `403 Forbidden` if authorization fails.

**3. Validation Strategy (Overall):**

*   **Gateway Validation:** Perform minimal, early-stage validation:
    *   Check path parameter format where simple (e.g., does `{customer_id}` roughly match `ddd-dd-dddd` pattern? Does `{ride_id}` match its expected format?).
    *   Verify the presence and value of `Content-Type: application/json` for POST/PATCH requests (except for image upload which is `multipart/form-data`).
    *   Enforce request body size limits.
    *   Basic JSON well-formedness check for relevant methods.
    *   Reject requests failing these basic checks early (`400 Bad Request`).
*   **Service Validation:** The **Customer Service** is responsible for comprehensive business logic validation:
    *   **Format Adherence:** Strict `customerId` (SSN: `xxx-xx-xxxx`), `email`, `state` (valid US state), `zipCode` (`xxxxx` or `xxxxx-xxxx`).
    *   **Required Fields:** Ensure all mandatory fields specified in the `Customer Input Object` or `Customer Update Object` are present.
    *   **Data Range/Value Checks:** Rating values (if managed here), potentially expiry dates for credit cards (must not be in the past - **handle CC data securely!**).
    *   **Existence Checks:** Does the specified `customer_id` exist for GET/PATCH/DELETE? Does the `ride_id` exist for image upload?
    *   **Duplicate Checks:** Ensure `customerId` is unique upon creation (`POST /customers` or processing `user.registered` event).
    *   **Cross-Field Consistency:** (If applicable, e.g., city/state/zip combinations, though complex).
    *   Return detailed `400 Bad Request` or `409 Conflict` errors with appropriate error codes (`invalid_input`, `missing_required_field`, `invalid_ssn_format`, `malformed_state`, `malformed_zipcode`, `invalid_credit_card`, `duplicate_customer`, etc.) as documented.

**I. Route-Specific Analysis (Billing Service)**

---

**Endpoint 1: `POST /bills`**

1.  **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to **Billing Service** at `/bills`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. The documentation notes this endpoint *might* be called internally by the Rides Service. The Gateway must still enforce authentication, potentially verifying a service-to-service token or a token belonging to an authorized entity (e.g., Admin, System Process). Fine-grained authorization (e.g., can *this* service/user create a bill for *this* ride?) likely resides in the Billing Service.
    *   **Rate Limiting:** Moderate. Less likely to be abused by end-users directly, but could be rate-limited based on source IP or service identity if called internally to prevent accidental floods.
    *   **Request/Response Transformation:** Minimal. Ensure `Content-Type: application/json`.

2.  **Kafka Topic Interaction:**
    *   **Topics Produced:** Yes, highly likely upon successful creation.
        *   Topic Name(s): `billing.bill.created`
        *   Event Type/Purpose: `BILL_CREATED` - Signals a new billing record is available.
        *   Key Payload Fields: `billingId`, `rideId`, `customerId`, `driverId`, `actualAmount`, `paymentStatus` (likely `PENDING`), `date`.
    *   **Topics Consumed:** No, this endpoint doesn't depend on consuming a specific topic *synchronously* to function. However, the Billing Service *itself* likely consumes a `ride.completed` event from the Rides Service, which *triggers* the logic that might lead to this API being called or the bill being created internally.

3.  **Client Update Mechanism:**
    *   **Primary Response:** Synchronous HTTP `201 Created` response containing the created `BillingInformation Object`.
    *   **Subsequent/Asynchronous Updates:** The `paymentStatus` is the most likely field to change asynchronously. The original caller (e.g., Rides Service, if internal) might not need immediate updates. End-users (Customer/Driver) would typically see updated status when retrieving their ride/billing history (polling `GET /bills/{id}` or `GET /bills?customer_id=...`). Push notifications could be implemented, triggered by a subsequent `billing.payment.updated` Kafka event.

4.  **Caching Strategy:**
    *   **Gateway Caching:** No. POST requests are not cacheable.
    *   **Service-Level Caching:** Yes. The Billing Service might cache bill details by `billingId` or `rideId` for faster retrieval via GET endpoints, but not relevant for the POST operation itself.
    *   **CDN Caching:** No. Authenticated POST operation.

---

**Endpoint 2: `GET /bills/{billing_id}`**

1.  **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to **Billing Service** at `/bills/{billing_id}`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. The Gateway validates the token is active and properly signed. The **Billing Service** is responsible for the fine-grained check: Does the `userId` in the token correspond to the `customerId` or `driverId` on the bill, OR does the user have an 'ADMIN' role?
    *   **Rate Limiting:** Yes. Standard per-user/per-token rate limiting is appropriate.
    *   **Request/Response Transformation:** Minimal. Could potentially extract user ID/roles from the token and pass them as trusted headers to the backend service.

2.  **Kafka Topic Interaction:**
    *   **Topics Produced:** No. GET requests typically do not produce Kafka events.
    *   **Topics Consumed:** No synchronous dependency.

3.  **Client Update Mechanism:**
    *   **Primary Response:** Synchronous HTTP `200 OK` response containing the requested `BillingInformation Object`.
    *   **Subsequent/Asynchronous Updates:** None expected from this specific API call. The data represents the state at the time of the request.

4.  **Caching Strategy:**
    *   **Gateway Caching:** Yes, potentially cacheable, keyed by `billing_id` *and* user context (e.g., derived from the Bearer token) to ensure users only see cached data they are authorized for. Requires a relatively short TTL (Time-To-Live) due to potential `paymentStatus` changes. Cache invalidation would be needed if the bill is updated or deleted.
    *   **Service-Level Caching:** Yes. The Billing Service is highly likely to cache billing records by ID (e.g., in Redis) for performance.
    *   **CDN Caching:** No. Authenticated, user-specific data.

---

**Endpoint 3: `GET /bills`**

1.  **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to **Billing Service** at `/bills`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. The **Billing Service** must perform authorization based on query parameters:
        *   If `customer_id` or `driver_id` query parameters are used, the service must verify the requesting user has appropriate permissions (e.g., 'ADMIN' role or matches the requested ID).
        *   If no ID filters are present, the service should implicitly filter results based on the `userId` extracted from the token (e.g., a customer sees their bills, a driver sees theirs).
    *   **Rate Limiting:** Yes. Crucial for list/search endpoints to prevent excessive load. Limit requests per user/token.
    *   **Request/Response Transformation:** Minimal. Validate query parameter formats if feasible (e.g., date format).

2.  **Kafka Topic Interaction:**
    *   **Topics Produced:** No.
    *   **Topics Consumed:** No synchronous dependency.

3.  **Client Update Mechanism:**
    *   **Primary Response:** Synchronous HTTP `200 OK` response containing a JSON array of `BillingInformation Object`s. Pagination headers (`X-Total-Count`, `Link` headers for next/prev) are common here.
    *   **Subsequent/Asynchronous Updates:** None expected. Pagination requires subsequent client calls to fetch more data.

4.  **Caching Strategy:**
    *   **Gateway Caching:** Generally difficult and less effective due to the variety of query parameter combinations and potentially large/dynamic result sets. Caching specific, very common, parameter-less queries might be possible with short TTLs, but often not worth the complexity.
    *   **Service-Level Caching:** Yes. The Billing Service might implement caching for common queries or use database-level caching.
    *   **CDN Caching:** No. Authenticated, often user-specific data.

---

**Endpoint 4: `DELETE /bills/{billing_id}`**

1.  **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to **Billing Service** at `/bills/{billing_id}`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. The **Billing Service** must enforce strict authorization. Deletion is sensitive; it should likely be restricted to users with an 'ADMIN' role or specific system processes.
    *   **Rate Limiting:** Yes. Standard rate limiting per user/token.
    *   **Request/Response Transformation:** Minimal.

2.  **Kafka Topic Interaction:**
    *   **Topics Produced:** Yes, assuming hard delete (as per docs). If implementing soft delete/voiding via PATCH, the event might differ.
        *   Topic Name(s): `billing.bill.deleted` (or `billing.bill.status.updated` if changed to VOID)
        *   Event Type/Purpose: `BILL_DELETED` (or `BILL_STATUS_UPDATED`) - Signals removal or invalidation for auditing/consistency.
        *   Key Payload Fields: `billingId`, `deletedByUserId` (or `updatedByUserId`), `timestamp`.
    *   **Topics Consumed:** No synchronous dependency.

3.  **Client Update Mechanism:**
    *   **Primary Response:** Synchronous HTTP `204 No Content`.
    *   **Subsequent/Asynchronous Updates:** No direct update to the original caller. Other systems might consume the Kafka event (e.g., audit log service).

4.  **Caching Strategy:**
    *   **Gateway Caching:** No (DELETE request). The Gateway (or Service) *must invalidate* any cached entries for `GET /bills/{billing_id}` upon successful deletion.
    *   **Service-Level Caching:** The Billing Service must invalidate its own cache for the deleted `billingId`.
    *   **CDN Caching:** No.

---

**II. Service-Wide Analysis (Billing Service)**

1.  **Signup Flow (Billing Service Specifics):**
    *   The **Billing Service does not handle user signups** (Driver, Customer, Admin). User identities are created via the Auth Service, and profiles are managed by the Customer and Driver Services, triggered by `user.registered` Kafka events.
    *   The Billing Service interacts with users *after* they exist and have participated in rides. Its primary "creation" flow relates to generating a bill (`POST /bills`) which is typically triggered *after* a ride is completed (likely initiated by the Rides service consuming its own events and then either calling `POST /bills` or creating the bill internally).
    *   **Synchronous Steps (Bill Creation - `POST /bills`):** Gateway routes authenticated request -> Billing Service validates input -> Billing Service creates bill record in its database -> Billing Service returns `201 Created` response.
    *   **Asynchronous Steps (Bill Creation - `POST /bills`):** Billing Service publishes `billing.bill.created` event to Kafka.
    *   **Key Validations (During Bill Creation):**
        *   ID Formats (`rideId`, `customerId`, `driverId`, `billingId` if generated externally): Must match `xxx-xx-xxxx`.
        *   Required Fields: Presence checks for all required fields in `Billing Input Object`.
        *   Data Types/Formats: Numeric fields (`distanceCovered`, amounts), ISO 8601 dates/times, valid Lat/Lon ranges.
        *   Cross-field Consistency: e.g., `dropoffTime` must be after `pickupTime`.
        *   Existence Checks: Verify that the provided `rideId`, `customerId`, `driverId` actually exist in their respective services (might involve cross-service communication or checks against replicated data/events).
        *   Duplicate Checks: Prevent creating multiple bills for the same `rideId` (as per `409 Conflict` documentation).

2.  **Authentication & Authorization Strategy (Overall):**
    *   **Mechanism:** Requires Bearer Token (JWT) authentication for all endpoints, as issued by the Auth Service.
    *   **Gateway Role:** Validate the Bearer Token's presence, signature, expiration, and issuer. Extract user identity (`userId`, potentially `roles`) from valid tokens. Reject requests with invalid/missing tokens (`401 Unauthorized`). Pass validated user context to the Billing Service (e.g., via trusted headers like `X-User-ID`, `X-User-Roles`).
    *   **Service Role:** Perform fine-grained authorization. Based on the user context received from the Gateway and the resource being accessed (`billingId` or query filters), the Billing Service determines if the action is permitted. Examples:
        *   `GET /bills/{id}`: Is `userId` the customer or driver on the bill, or is the role 'ADMIN'?
        *   `GET /bills`: If no ID filter, return bills for the `userId`. If ID filter present, check 'ADMIN' role or if `userId` matches the filter.
        *   `POST /bills`: Is the caller an authorized service or 'ADMIN'?
        *   `DELETE /bills/{id}`: Does the user have the 'ADMIN' role?

3.  **Validation Strategy (Overall):**
    *   **Gateway Validation:** Minimal. Can perform basic checks like:
        *   Path Parameter Format: Does `{billing_id}` superficially match the `xxx-xx-xxxx` pattern?
        *   Header Checks: Ensure `Content-Type: application/json` for POST requests.
        *   Query Parameter Format: Basic type checks (e.g., is `limit` an integer?).
        *   *Avoid* complex business logic or deep payload validation at the Gateway.
    *   **Service Validation:** The **Billing Service** is responsible for all significant business logic validation as detailed in its "Validation Notes" and implied by the `400 Bad Request` error conditions:
        *   Strict ID Format (`xxx-xx-xxxx`).
        *   ISO 8601 Date/Time format adherence.
        *   Numeric field validation (non-negative amounts, valid numbers, lat/lon ranges).
        *   Enum validation (`paymentStatus`).
        *   Required field presence for creation.
        *   Existence checks for related entities (`rideId`, `customerId`, `driverId`).
        *   Duplicate prevention (e.g., based on `rideId`).

**I. Route-Specific Analysis (Rides Service)**

---

**1. Endpoint: `POST /rides` (Request Ride)**

*   **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Rides Service at `/rides`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. Verify token belongs to an authenticated user (likely Customer role).
    *   **Rate Limiting:** Yes, High Priority. Limit per authenticated customer to prevent spamming ride requests. Consider IP-based limiting for unauthenticated requests (though this endpoint requires auth).
    *   **Request/Response Transformation:** Minimal. Could add `X-User-ID` header extracted from the token for downstream service use. Could potentially strip sensitive info from the response if needed, though the `202 Accepted` response seems safe.
*   **Kafka Topic Interaction:**
    *   **Topics Produced:** Yes, upon successful initial acceptance and creation of the ride record.
        *   Topic Name(s): `ride.requested`
        *   Event Type/Purpose: `RIDE_REQUESTED` (To initiate the asynchronous driver matching process).
        *   Key Payload Fields: `rideId` (newly generated), `customerId` (from token), `pickupLocation`, `dropoffLocation`, `requestTimestamp`, `predictedFare`.
    *   **Topics Consumed:** No, this endpoint initiates the process.
*   **Client Update Mechanism:**
    *   **Primary Response:** Synchronous HTTP `202 Accepted` containing the initial `Ride Object` (status `REQUESTED`).
    *   **Subsequent/Asynchronous Updates:** Essential. The client needs updates on matching status (`NO_DRIVERS_AVAILABLE`, `ACCEPTED`), driver details upon acceptance, driver location (`DRIVER_ARRIVED`), ride progress (`IN_PROGRESS`), and final state (`COMPLETED`, `CANCELLED`). This strongly necessitates a **WebSocket or Server-Sent Events (SSE)** connection where the client subscribes to events scoped to their specific `rideId`. Polling `GET /rides/{ride_id}` is a less efficient alternative.
*   **Caching Strategy:**
    *   **Gateway Caching:** No. POST requests are not cacheable.
    *   **Service-Level Caching:** No, this creates a new resource.
    *   **CDN Caching:** No.

---

**2. Endpoint: `GET /rides/{ride_id}` (Get Ride Details)**

*   **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Rides Service at `/rides/{ride_id}`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. The *service* must perform authorization: verify the authenticated user (`customerId` or `driverId` from token) is associated with this `ride_id`, or the user has an Admin role.
    *   **Rate Limiting:** Yes, Moderate Priority. Limit per user/ride_id to prevent excessive polling if used as an update mechanism.
    *   **Request/Response Transformation:** Minimal. Could add `X-User-ID` header.
*   **Kafka Topic Interaction:**
    *   **Topics Produced:** No. This is a read operation.
    *   **Topics Consumed:** No. Reads the current state from the Rides Service database/cache.
*   **Client Update Mechanism:**
    *   **Primary Response:** Synchronous HTTP `200 OK` containing the current `Ride Object`.
    *   **Subsequent/Asynchronous Updates:** None expected *from this specific call*. Updates should be pushed via WebSocket/SSE.
*   **Caching Strategy:**
    *   **Gateway Caching:** Potentially, with a **very short TTL (e.g., 1-5 seconds)**. Key must include `ride_id` AND the `Authorization` header (or derived `userId`). High invalidation rate due to frequent status changes makes this challenging and potentially low value.
    *   **Service-Level Caching:** Yes. The Rides Service should cache ride states (especially active ones) in memory or Redis for fast retrieval, invalidated by internal state change events (often driven by Kafka).
    *   **CDN Caching:** No (due to Authentication).

---

**3. Endpoint: `GET /rides` (List Rides)**

*   **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Rides Service at `/rides`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. Service filters results based on the authenticated user (`customerId` or `driverId`). Gateway *must* verify Admin role in token if `for_customer_id` or `for_driver_id` query parameters are present, potentially rejecting early (`403 Forbidden`) if non-admin attempts to use them.
    *   **Rate Limiting:** Yes, Moderate Priority. Limit per user to prevent fetching large histories frequently.
    *   **Request/Response Transformation:** Minimal.
*   **Kafka Topic Interaction:**
    *   **Topics Produced:** No. Read operation.
    *   **Topics Consumed:** No. Reads historical/current data.
*   **Client Update Mechanism:**
    *   **Primary Response:** Synchronous HTTP `200 OK` containing a JSON array of `Ride Object`s.
    *   **Subsequent/Asynchronous Updates:** None expected from this call.
*   **Caching Strategy:**
    *   **Gateway Caching:** Potentially, with a moderate TTL (e.g., 30-60 seconds). Key must include query parameters AND `Authorization` header. Cache should ideally be invalidated when a ride associated with the user changes to a terminal state (COMPLETED, CANCELLED). Complexity might outweigh benefits.
    *   **Service-Level Caching:** Yes. The service might cache lists of ride IDs per user or use efficient database indexing.
    *   **CDN Caching:** No.

---

**4. Endpoint: `DELETE /rides/{ride_id}` (Cancel Ride)**

*   **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Rides Service at `/rides/{ride_id}`.
    *   **Authentication/Authorization:** Verify valid Bearer Token. The *service* must perform authorization: verify the authenticated user is allowed to cancel this ride (e.g., is the customer or assigned driver, and the ride is in a cancellable state like `REQUESTED` or `ACCEPTED`).
    *   **Rate Limiting:** Yes, Moderate Priority. Limit per user/ride_id.
    *   **Request/Response Transformation:** Minimal.
*   **Kafka Topic Interaction:**
    *   **Topics Produced:** Yes, upon successful cancellation.
        *   Topic Name(s): `ride.cancelled`
        *   Event Type/Purpose: `RIDE_CANCELLED` (To notify other systems/parties and potentially trigger re-matching if cancelled by driver).
        *   Key Payload Fields: `rideId`, `customerId`, `driverId` (if assigned), `cancelledBy` ("CUSTOMER" or "DRIVER" based on who initiated), `timestamp`, `previousStatus`.
    *   **Topics Consumed:** No.
*   **Client Update Mechanism:**
    *   **Primary Response:** Synchronous HTTP `204 No Content`.
    *   **Subsequent/Asynchronous Updates:** The *other* party involved (e.g., driver if customer cancels, customer if driver cancels) needs notification, likely via WebSocket/SSE driven by the `ride.cancelled` Kafka event.
*   **Caching Strategy:**
    *   **Gateway Caching:** No. DELETE methods are not cacheable. Must invalidate any cached `GET /rides/{ride_id}` entry.
    *   **Service-Level Caching:** Yes. Invalidate any cached state for this `rideId`.
    *   **CDN Caching:** No.

---

**5. Endpoint: `GET /drivers/nearby` (Find Nearby Drivers)**

*   **API Gateway Responsibilities:**
    *   **Routing Target:** Routes to Rides Service at `/drivers/nearby`. (Note: Path suggests drivers, but functionality placed under Rides Service implies it orchestrates this, likely querying location data sourced from Driver Service).
    *   **Authentication/Authorization:** Verify valid Bearer Token (likely Customer role). Prevent unauthenticated scraping.
    *   **Rate Limiting:** Yes, **Very High Priority**. This endpoint involves a potentially expensive geo-spatial query and exposes near real-time driver locations. Implement strict limits per user and potentially globally.
    *   **Request/Response Transformation:** Minimal.
*   **Kafka Topic Interaction:**
    *   **Topics Produced:** No. Read operation.
    *   **Topics Consumed:** Indirectly. The endpoint relies on up-to-date driver location data. This data is likely maintained in a specialized cache (e.g., Redis Geo) within or accessible by the Rides/Driver service, which *consumes* `driver.location.updated` events from Kafka in the background to keep the cache current. The API call itself doesn't consume events.
*   **Client Update Mechanism:**
    *   **Primary Response:** Synchronous HTTP `200 OK` with a JSON array of `Nearby Driver Object`s.
    *   **Subsequent/Asynchronous Updates:** None from this specific call. A UI showing live driver locations would either poll this endpoint frequently (inefficient) or ideally receive location updates via **WebSocket/SSE** for drivers within a certain bounding box around the user.
*   **Caching Strategy:**
    *   **Gateway Caching:** No. Data is extremely volatile (real-time locations).
    *   **Service-Level Caching:** **Essential**. The backend *must* use a highly optimized cache (like Redis with Geo commands, or a dedicated spatial index) for driver locations, updated asynchronously by location events. This endpoint queries the cache, not the primary driver database.
    *   **CDN Caching:** No.

---

**II. Service-Wide Analysis (Rides Service)**

**1. Signup Flow (Rides Service Specifics):**

*   The **Rides Service** does *not* directly handle user signup (Driver or Customer).
*   **Signup Trigger:** Signup is initiated via the **Auth Service** (`POST /auth/register/customer` or `POST /auth/register/driver`).
*   **Auth Service Synchronous Steps:** Validates input, creates user credentials (hashed password) in its DB, generates JWTs, returns tokens to the client.
*   **Auth Service Asynchronous Steps:** Publishes a `user.registered` event to Kafka containing `userId`, `userType`, email, name, phone, and potentially other initial details.
*   **Profile Creation:** The **Customer Service** or **Driver Service** consumes the `user.registered` event and creates the corresponding profile in *its* database.
*   **Rides Service Role:** The Rides Service *uses* these pre-existing Customer and Driver profiles (identified by `customerId` and `driverId`, often derived from the Bearer Token) when processing ride requests (`POST /rides`), assigning drivers, and retrieving ride details (`GET /rides/{id}`). It relies on the Customer/Driver services for profile data validity.
*   **Key Validations (Handled by Auth/Customer/Driver Services):** SSN Format for IDs, email format, password complexity, required fields for profile creation (name, phone, potentially address/car details for drivers). Duplicate `userId` / `email` checks are handled by the Auth service.

**2. Authentication & Authorization Strategy (Overall):**

*   **Mechanism:** All Rides Service endpoints require a `Bearer Token` (JWT) obtained from the Auth Service via login or registration.
*   **Gateway Role:**
    *   Verify the presence, format (`Bearer <token>`), signature, and expiration of the JWT `accessToken` on every request to the Rides Service.
    *   Reject requests with invalid/expired tokens immediately (`401 Unauthorized`).
    *   Extract `userId` and potentially `roles` (e.g., `CUSTOMER`, `DRIVER`, `ADMIN`) from the token claims.
    *   Optionally, pass `userId` and `roles` to the Rides Service via trusted headers (e.g., `X-User-ID`, `X-User-Roles`).
    *   Perform basic role checks for admin-only query parameters (`GET /rides`).
*   **Service Role (Rides Service):**
    *   Trust that the token itself has been validated by the Gateway.
    *   Perform *resource-specific authorization* using the `userId` and `roles` provided:
        *   `POST /rides`: Verify the user role is `CUSTOMER`. Use `userId` as `customerId`.
        *   `GET /rides/{ride_id}`, `DELETE /rides/{ride_id}`: Verify the `userId` matches the `customerId` or the (assigned) `driverId` of the specified `rideId`, OR that the user has an `ADMIN` role. Return `403 Forbidden` if access is denied.
        *   `GET /rides`: Filter results based on the `userId` (matching `customerId` or `driverId`). Check for `ADMIN` role if `for_customer_id` or `for_driver_id` parameters are used.
        *   `GET /drivers/nearby`: Verify the user role is `CUSTOMER` (or potentially `ADMIN`).

**3. Validation Strategy (Overall):**

*   **Gateway Validation:** Minimal, focusing on request structure and basic formats:
    *   Path parameter format (check if `ride_id` matches the expected SSN format `xxx-xx-xxxx`).
    *   Query parameter types (e.g., `limit`/`offset`/`radius_miles` are numeric).
    *   Presence of `Content-Type: application/json` for `POST /rides`.
    *   Presence and basic format of `Authorization: Bearer <token>` header.
*   **Service Validation (Rides Service):** Responsible for primary business logic validation:
    *   **Input Data:** Validate `pickupLocation` and `dropoffLocation` coordinates (valid latitude/longitude ranges) in `POST /rides`.
    *   **ID Existence/Format:** Ensure provided IDs (like `ride_id` in path) are valid format and exist. Use `customerId` from validated token.
    *   **State Logic:** Enforce state transition rules (e.g., cannot cancel a `COMPLETED` ride via `DELETE /rides/{ride_id}`). Check ride status for applicable actions.
    *   **Resource Ownership:** Implicitly validated during authorization checks (e.g., ensuring customer requesting details owns the ride).
    *   **Dependencies:** Handle potential errors from interactions with other services (e.g., Pricing service failure during `POST /rides`, inability to fetch driver locations for `GET /drivers/nearby`).
