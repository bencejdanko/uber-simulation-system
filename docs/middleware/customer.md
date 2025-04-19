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
