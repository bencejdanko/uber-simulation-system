Okay, let's break down the Kafka-centric architecture into actionable subtasks for the Driver, Billing, and Admin services, focusing on creating a testable barebones scaffold by **Tuesday 8 PM**.

**Core Philosophy:** Get the infrastructure running, establish the basic communication pathways (API Gateway -> Kafka -> Consumers), and create the minimal service structures and persistence layers (Mongoose models). Full logic and error handling come later.

**Critical Dependencies Identification:**

1.  **Infrastructure (Kafka, ZK, Redis, Mongo):** Everything depends on this running locally via Docker Compose. **Highest Priority.**
2.  **Shared Base Configuration:** Consistent TS config, linting, logging, and basic Kafka/Redis client wrappers are needed by all services to avoid duplication. **High Priority.**
3.  **API Gateway:** The entry point. Needs to exist to produce *any* messages to Kafka.
4.  **Kafka Topics & Schemas:** Services need to agree on topic names and basic message structures (even if just TS interfaces initially).
5.  **Core Mongoose Models:** Consumers need the Mongoose schemas defined to interact with MongoDB.
6.  **Consumers:** Need Kafka, the relevant models, and the DB running to perform their basic function (consume -> log/save).

**Waterfall-Focused Workflow (Phased Approach):**

**Phase 0: Infrastructure & Foundation (Monday PM - EOD)**

*   **(Task 0.1 - Infra Lead/Team):** Create/Finalize `docker-compose.yml` including:
    *   Kafka (e.g., `bitnami/kafka` or `confluentinc/cp-kafka`)
    *   Zookeeper (required by Kafka)
    *   Redis (e.g., `redis:latest` or `redis/redis-stack`)
    *   MongoDB (`mongo:latest`)
    *   Define necessary volumes for data persistence (e.g., `./mongo-data:/data/db`, `./redis-data:/data`).
    *   Configure basic environment variables (e.g., Kafka ports, advertised listeners, Mongo creds).
    *   **Deliverable:** A working `docker-compose.yml` that successfully launches all infrastructure components locally. **Blocker for all subsequent work.**
*   **(Task 0.2 - Tech Lead/Senior):** Create `shared-base` project/template OR establish conventions:
    *   Standard `tsconfig.json`.
    *   ESLint + Prettier config (`.eslintrc.js`, `.prettierrc.js`).
    *   Pino logger setup (`src/config/logger.ts`).
    *   Basic Typed Config loader (`src/config/index.ts` using `dotenv`).
    *   *Simple* Kafka client wrapper (`src/kafka/client.ts` using `kafkajs` - basic producer/consumer init, connect, disconnect).
    *   *Simple* Redis client wrapper (`src/redis/client.ts`).
    *   Standard `.gitignore`, basic `Dockerfile` template.
    *   **Deliverable:** A template/set of files easily copyable into each new service repository, OR clear documentation on these standard setups. **Dependency for all service implementations.**
*   **(Task 0.3 - Team):** Define Initial Kafka Topics & Basic Message Interfaces:
    *   Topics: `signup_requests`, `driver_location_updates`, `ride_requests` (placeholder), `ride_completed` (placeholder).
    *   Create simple TypeScript interfaces for the expected message payloads for these topics (e.g., `SignupRequestPayload`, `LocationUpdatePayload`, `RideCompletedPayload`) in a shared location or documented clearly.
    *   **Deliverable:** Documented list of topics and TS interfaces. **Dependency for Producer/Consumer logic.**

**Phase 1: API Gateway & Core Models (Tuesday AM)**

*   **(Task 1.1 - Assigned Dev):** Setup `api-gateway` Service:
    *   Create repository (`api-gateway`).
    *   Initialize Node/TS project, integrate `shared-base` configs/wrappers.
    *   Setup basic Express server (`app.ts`, `server.ts`).
    *   Configure Kafka *Producer* using the shared wrapper.
    *   Implement **placeholder** `POST /api/v1/signup` endpoint:
        *   Minimal validation (just log request body).
        *   Produce a hardcoded/simple message to `signup_requests` topic using the producer.
        *   Return `202 Accepted`.
    *   Implement **placeholder** `POST /api/v1/drivers/:id/location` endpoint:
        *   Minimal validation.
        *   Produce a hardcoded/simple message to `driver_location_updates` topic.
        *   Return `202 Accepted`.
    *   **Deliverable:** Running API Gateway service connected to Kafka, able to produce messages for signup and location updates. **Dependency for end-to-end testing.**
*   **(Task 1.2 - Assigned Dev - Driver Focus):** Define Driver Mongoose Model:
    *   In a suitable location (e.g., within the future `driver-service` repo structure, even if the consumer isn't built yet, or a temporary shared types repo).
    *   Create `src/models/driver.model.ts`.
    *   Define the `IDriver` interface and `driverSchema` with *minimal core fields* required for signup (e.g., `externalDriverId` or placeholder ID, `email`, `firstName`, `lastName`, `role='driver'`). Include `timestamps: true`.
    *   Export `DriverModel`.
    *   **Deliverable:** `driver.model.ts` file. **Dependency for Signup Consumer.**
*   **(Task 1.3 - Assigned Dev - Customer Focus):** Define Customer Mongoose Model:
    *   Similar to Task 1.2, create `src/models/customer.model.ts`.
    *   Define `ICustomer` interface and `customerSchema` (e.g., `externalCustomerId`, `email`, `firstName`, `lastName`, `role='customer'`). Include `timestamps: true`.
    *   Export `CustomerModel`.
    *   **Deliverable:** `customer.model.ts` file. **Dependency for Signup Consumer.**
*   **(Task 1.4 - Assigned Dev - Billing Focus):** Define Billing Mongoose Model:
    *   Create `src/models/billing.model.ts`.
    *   Define `IBillingInformation` interface and `billingSchema` with *minimal fields* (e.g., `rideId`, `customerId`, `driverId`, `actualAmount`, `paymentStatus`). Include `timestamps: true`.
    *   Export `BillingModel`.
    *   **Deliverable:** `billing.model.ts` file. **Dependency for Billing Consumer.**

**Phase 2: Core Consumers & Basic Persistence (Tuesday Midday - PM)**

*   **(Task 2.1 - Assigned Dev - Driver/Customer):** Setup `signup-consumer` Service:
    *   Create repository (`signup-consumer`).
    *   Initialize Node/TS project, integrate `shared-base`.
    *   Setup Mongoose connection (`src/db.ts`).
    *   Import `DriverModel` and `CustomerModel`.
    *   Configure Kafka *Consumer* using the shared wrapper, subscribing to `signup_requests` (use a unique `groupId`).
    *   Implement basic `eachMessage` handler:
        *   Log received message.
        *   Attempt to parse payload (use defined TS interface).
        *   Based on a role field (add to `SignupRequestPayload`), create *either* a `DriverModel` or `CustomerModel` instance with data from the payload.
        *   Attempt `model.save()`.
        *   Log success or failure of the save operation.
        *   **No complex validation or error handling yet.**
    *   **Deliverable:** Running consumer service attempting to save Driver/Customer records to MongoDB based on Kafka messages. **Depends on Phase 0, Models.**
*   **(Task 2.2 - Assigned Dev - Driver):** Setup `location-consumer` Service:
    *   Create repository (`location-consumer`).
    *   Initialize Node/TS project, integrate `shared-base`.
    *   Setup Redis connection (`src/redisClient.ts` or similar).
    *   Configure Kafka Consumer for `driver_location_updates`.
    *   Implement basic `eachMessage` handler:
        *   Log received message.
        *   Attempt to parse payload (use `LocationUpdatePayload` interface).
        *   Attempt Redis `GEOADD` command (e.g., `GEOADD driver_locations <longitude> <latitude> <driverId>`).
        *   Log success or failure of Redis command.
    *   **Deliverable:** Running consumer service attempting to update driver locations in Redis based on Kafka messages. **Depends on Phase 0.**
*   **(Task 2.3 - Assigned Dev - Billing):** Setup `billing-consumer` Service:
    *   Create repository (`billing-consumer`).
    *   Initialize Node/TS project, integrate `shared-base`.
    *   Setup Mongoose connection.
    *   Import `BillingModel`.
    *   Configure Kafka Consumer for placeholder `ride_completed` topic.
    *   Implement basic `eachMessage` handler:
        *   Log received message.
        *   Attempt to parse payload (use placeholder `RideCompletedPayload`).
        *   Create a `BillingModel` instance.
        *   Attempt `model.save()`.
        *   Log success or failure.
    *   **Deliverable:** Running consumer service attempting to save basic Billing records to MongoDB based on Kafka messages. **Depends on Phase 0, Billing Model.**

**Phase 3: Integration & Smoke Test (Tuesday EOD)**

*   **(Task 3.1 - Team):** Run Full System & Basic Test:
    *   Ensure all infrastructure is running (`docker-compose up`).
    *   Start all services (`api-gateway`, `signup-consumer`, `location-consumer`, `billing-consumer`).
    *   Use `curl` or Postman to send a request to `POST /api/v1/signup` on the API Gateway.
    *   Use `curl` or Postman to send a request to `POST /api/v1/drivers/some-id/location`.
    *   **Verify:**
        *   API Gateway logs show message produced.
        *   Signup Consumer logs show message received and attempt to save to Mongo (check Mongo manually for a new record if possible).
        *   Location Consumer logs show message received and attempt to update Redis (check Redis manually via `redis-cli` if possible: `GEOPOS driver_locations some-id`).
        *   (Optional: Manually produce a message to `ride_completed` topic using a Kafka tool like `kcat` or a simple script, verify Billing Consumer logs it/tries to save).
*   **(Task 3.2 - Team):** Basic Documentation:
    *   Add minimal `README.md` to each service repository explaining:
        *   Purpose of the service.
        *   How to install dependencies (`npm install`).
        *   How to run it (`npm run dev`).
        *   Required environment variables (`.env.example`).
        *   How to run the *entire system* using the main `docker-compose.yml`.
    *   **Deliverable:** Committed code for all scaffolded services and basic READMEs.

**Service Responsibility Breakdown (for Scaffolding Phase):**

*   **Driver Service (Conceptual):**
    *   Owns `driver.model.ts`.
    *   Logic split between `signup-consumer` (for creating driver records) and `location-consumer` (for handling location updates).
    *   API Gateway handles producing `driver_location_updates`.
*   **Customer Service (Conceptual):**
    *   Owns `customer.model.ts`.
    *   Logic handled by `signup-consumer` (for creating customer records).
*   **Billing Service:**
    *   Owns `billing.model.ts`.
    *   Owns `billing-consumer` service (listens for ride completion).
*   **Admin Service:**
    *   **Deferred for scaffolding.** No specific components needed *yet* unless an admin signup flow is critical Day 1 (if so, modify `signup-consumer`). Its dependencies (data from other services) won't exist meaningfully until later.
*   **Rides Service (Conceptual):**
    *   Logic split between `ride-request-consumer` (not built yet), `ride-status-consumer` (not built yet), and API Gateway (for accepting initial request). Minimal placeholder interaction via `ride_completed` topic for Billing scaffold.

This plan focuses relentlessly on the connections and basic structures needed to have *something* running and testable across the Kafka backbone by the deadline. Full implementation of the API docs comes *after* this scaffold is stable.