**To: Bence Danko (Tier 2 - Middleware)**

**Subject: Your Goals & Duties for April 16th - 17th - Unblocking & Acceleration**

Hi Bence,

Thanks for completing your initial service setups. The critical path is now waiting on the Database tier. Be ready to move fast once unblocked.

**Accumulated & New Responsibilities for Wed, Apr 16th & Thurs, Apr 17th:**

1.  **Monitor DB Status (Wed Morning):** Keep checking for notifications from Kushal/Nairui regarding schema finalization (DB-1) and DB instance readiness (DB-2).
2.  **Refine Service Setups & Common Elements (MW-1) (Wed Morning):** While waiting, ensure your Driver, Billing, Admin service setups are clean. Continue collaborating with Cyril on any shared utilities/configs.
3.  **IMMEDIATE START once unblocked (MW-3): Implement DALs (Target: EOD Wed, Apr 16th):**
    *   **Action:** As *soon* as the final schema (DB-1) is available AND the DB instance is accessible (DB-2) AND creation scripts (DB-3) have run successfully, **immediately start implementing the Data Access Layer (DAL) / Repository functions** for **Driver, Billing, and Admin** services. Focus on core CRUD methods first (Create, GetById, basic List, Delete).
    *   **Deliverable:** Functional DAL code committed for your services.
4.  **Start Core CRUD API Endpoints (MW-4) (Target: Progress by EOD Wed, Focus on Thurs, Apr 17th):**
    *   **Action:** As soon as the DAL methods are available, start implementing the core API endpoints for **Driver, Billing, and Admin** (`POST`, `GET /{id}`, basic `GET /`, `DELETE /{id}`). Implement basic input validation. Ensure Cyril's Auth Hook (MW-2) is applied (or use a placeholder if still pending).
    *   **Deliverable:** Aim to have `POST` and `GET /{id}` for Driver functional by EOD Wed. Complete the rest of core CRUD for Driver, Billing, Admin by EOD Thurs. **Notify David/Anne when endpoints are testable (even basic versions).**

**By End of Day Wednesday, April 16th, you MUST have:**
*   Completed the DAL implementation for Driver, Billing, Admin (assuming DB is ready mid-day).
*   Ideally started implementing POST/GET Driver endpoints.

**By End of Day Thursday, April 17th, you MUST have:**
*   Completed implementing the core CRUD API endpoints (POST, GET /id, GET list, DELETE) for Driver, Billing, and Admin.
*   Endpoints should be minimally testable via Postman/curl.

We need to accelerate significantly. Your rapid progress on the DAL and APIs once unblocked is crucial for the Friday milestone.