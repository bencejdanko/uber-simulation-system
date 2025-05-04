**To: Cyril Goud Bhooma Goud (Tier 2 - Middleware)**

**Subject: URGENT CATCH-UP: Your Goals & Duties for April 16th - 17th**

Hi Cyril,

We need to urgently catch up on your tasks from Mon/Tue, alongside starting the critical path work once the database is ready.

**Accumulated & New Responsibilities for Wed, Apr 16th & Thurs, Apr 17th:**

1.  **IMMEDIATE PRIORITY (MW-1): Complete Service Project Setup (Target: Morning Wed, Apr 16th):**
    *   **Action:** You *must* complete the setup of basic, runnable project structures for **Customer and Rides** services. Collaborate with Bence on common elements.
    *   **Deliverable:** Runnable Customer/Rides service projects committed. `/docs/development_setup.md` updated.
2.  **IMMEDIATE PRIORITY (MW-2): Implement Basic Auth Hook (Target: Morning Wed, Apr 16th):**
    *   **Action:** Implement the basic authentication hook placeholder as planned. Ensure it can be applied to endpoints.
    *   **Deliverable:** Functional auth hook code committed.
3.  **Monitor DB Status (Wed Morning):** Keep checking for notifications from Kushal/Nairui regarding schema finalization (DB-1) and DB instance readiness (DB-2).
4.  **IMMEDIATE START once unblocked (MW-3): Implement DALs (Target: EOD Wed, Apr 16th):**
    *   **Action:** As *soon* as the final schema (DB-1) is available AND the DB instance is accessible (DB-2) AND creation scripts (DB-3) have run successfully, **immediately start implementing the Data Access Layer (DAL) / Repository functions** for **Customer and Rides** services. Focus on core CRUD methods first (Create, GetById, basic List, Delete).
    *   **Deliverable:** Functional DAL code committed for your services.
5.  **Start Core CRUD API Endpoints (MW-4) (Target: Progress by EOD Wed, Focus on Thurs, Apr 17th):**
    *   **Action:** As soon as the DAL methods are available, start implementing the core API endpoints for **Customer and Rides** (`POST`, `GET /{id}`, basic `GET /`, `DELETE /{id}`). Implement basic input validation. Apply your Auth Hook (MW-2).
    *   **Deliverable:** Aim to have `POST` and `GET /{id}` for Customer functional by EOD Wed. Complete the rest of core CRUD for Customer, Rides by EOD Thurs. **Notify David/Anne when endpoints are testable (even basic versions).**

**By End of Day Wednesday, April 16th, you MUST have:**
*   Completed Customer/Rides service setup (MW-1) and Auth Hook (MW-2).
*   Completed the DAL implementation for Customer, Rides (assuming DB is ready mid-day).
*   Ideally started implementing POST/GET Customer endpoints.

**By End of Day Thursday, April 17th, you MUST have:**
*   Completed implementing the core CRUD API endpoints (POST, GET /id, GET list, DELETE) for Customer and Rides.
*   Endpoints should be minimally testable via Postman/curl.

Catching up and hitting these targets is essential. Communicate progress and blockers IMMEDIATELY.