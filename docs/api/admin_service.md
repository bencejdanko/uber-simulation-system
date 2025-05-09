# Admin Service API Documentation

**Version:** 1.0
**Base URL:** `/api/v1/admin`
**Authentication:** Bearer Token (Specifics TBD - **Strict Admin Role Required** for all endpoints)
**Content-Type:** `application/json`

## Overview

The Admin Service provides administrative functionalities for managing the Uber simulation system. This includes adding core entities (drivers, customers), reviewing accounts, viewing system-wide statistics and analytics, and searching billing records. Access to this service is restricted to users with administrative privileges.

---

## Data Structures

### Admin Object (Minimal)

Represents an administrator (less critical for simulation focus, but included for completeness).

```json
{
  "adminId": "string (SSN Format: xxx-xx-xxxx)", // As per spec
  "firstName": "string",
  "lastName": "string",
  "email": "string (email format)",
  "createdAt": "string (ISO 8601 Format)"
  // Address, Phone etc. as needed, following project spec page 4
}
```

### SystemStatistics Object

Represents aggregated statistics.

```json
{
  "timePeriod": {
    "startDate": "string (YYYY-MM-DD)",
    "endDate": "string (YYYY-MM-DD)"
  },
  "areaFilter": "string (e.g., 'All', 'Zip:95123', 'City:San Jose')", // How the area was filtered
  "totalRevenue": "number (Currency, e.g., USD)",
  "totalRides": "integer",
  "averageRideFare": "number (Currency, e.g., USD)",
  "averageRideDistance": "number (e.g., miles or km)"
  // Potentially add breakdowns per day/week within the period
}
```

### ChartData Object

Represents data formatted for generating charts/graphs. Structure depends heavily on the charting library used.

```json
{
  "chartType": "string (e.g., 'rides_per_area', 'revenue_per_driver', 'rides_over_time')",
  "labels": ["string", "string", "..."], // e.g., Area names, Driver names, Dates
  "datasets": [
    {
      "label": "string (e.g., 'Number of Rides', 'Total Revenue')",
      "data": ["number", "number", "..."] // Corresponding values
      // Add styling info if needed (colors, etc.)
    }
    // Potentially multiple datasets for comparison charts
  ]
}
```

### Error Response Object

Standard format for error responses.

```json
{
  "error": "string (error code, e.g., 'unauthorized', 'invalid_input', 'not_found')",
  "message": "string (detailed error message)"
}
```

*(Note: This service might reuse `Driver Object`, `Customer Object`, and `BillingInformation Object` from other services for review/search responses)*

---

## Endpoints

### 1. Add Driver (Admin)

*   **Description:** Allows an administrator to add a new driver to the system. Might have different validation rules or permissions than the public Driver Service endpoint.
*   **Endpoint:** `POST /drivers`
*   **Request Body:** `Driver Input Object` (from `driver_service.md`)
*   **Responses:**
    *   `201 Created`: Driver successfully created. Response body contains the created `Driver Object`.
    *   `400 Bad Request`: Invalid input data. Response body contains `Error Response Object`.
    *   `401 Unauthorized`: Request lacks valid admin credentials.
    *   `403 Forbidden`: Authenticated user does not have admin privileges.
    *   `409 Conflict`: Driver with this ID already exists. Response body contains `Error Response Object`.
    *   `500 Internal Server Error`: Unexpected server error.

### 2. Add Customer (Admin)

*   **Description:** Allows an administrator to add a new customer to the system.
*   **Endpoint:** `POST /customers`
*   **Request Body:** `Customer Input Object` (from `customer_service.md`)
*   **Responses:**
    *   `201 Created`: Customer successfully created. Response body contains the created `Customer Object` (sensitive CC details masked).
    *   `400 Bad Request`: Invalid input data. Response body contains `Error Response Object`.
    *   `401 Unauthorized`: Request lacks valid admin credentials.
    *   `403 Forbidden`: Authenticated user does not have admin privileges.
    *   `409 Conflict`: Customer with this ID already exists. Response body contains `Error Response Object`.
    *   `500 Internal Server Error`: Unexpected server error.

### 3. Review Driver Account

*   **Description:** Retrieves detailed information about a specific driver account for administrative review. May include more data than the public endpoint.
*   **Endpoint:** `GET /drivers/{driver_id}`
*   **Path Parameters:**
    *   `driver_id` (string, required): The SSN format ID of the driver to review.
*   **Responses:**
    *   `200 OK`: Driver details retrieved. Response body contains `Driver Object` (potentially with additional admin-only fields).
    *   `400 Bad Request`: Invalid `driver_id` format. Response body contains `Error Response Object`.
    *   `401 Unauthorized`: Request lacks valid admin credentials.
    *   `403 Forbidden`: Authenticated user does not have admin privileges.
    *   `404 Not Found`: Driver not found. Response body contains `Error Response Object`.
    *   `500 Internal Server Error`: Unexpected server error.

### 4.  Customer Account

*   **Description:** Retrieves detailed information about a specific customer account for administrative review.
*   **Endpoint:** `GET /customers/{customer_id}`
*   **Path Parameters:**
    *   `customer_id` (string, required): The SSN format ID of the customer to review.
*   **Responses:**
    *   `200 OK`: Customer details retrieved. Response body contains `Customer Object` (sensitive CC details masked, potentially with additional admin-only fields).
    *   `400 Bad Request`: Invalid `customer_id` format. Response body contains `Error Response Object`.
    *   `401 Unauthorized`: Request lacks valid admin credentials.
    *   `403 Forbidden`: Authenticated user does not have admin privileges.
    *   `404 Not Found`: Customer not found. Response body contains `Error Response Object`.
    *   `500 Internal Server Error`: Unexpected server error.

### 5. Get System Statistics

*   **Description:** Retrieves aggregated statistics like total revenue and rides, filterable by date range and geographical area.
*   **Endpoint:** `GET /statistics`
*   **Query Parameters (Optional):**
    *   `start_date` (string, YYYY-MM-DD): Start date for the statistics period. (Required if `end_date` is provided).
    *   `end_date` (string, YYYY-MM-DD): End date for the statistics period. (Required if `start_date` is provided). Defaults to today if only `start_date` is given or covers all time if neither is given.
    *   `area_type` (string, Enum: `city`, `zip`, `zone`, `all`): Type of area filter. Defaults to `all`.
    *   `area_value` (string): The specific value for the area filter (e.g., "San Jose", "95123"). Required if `area_type` is not `all`.
*   **Responses:**
    *   `200 OK`: Statistics retrieved successfully. Response body contains `SystemStatistics Object`.
    *   `400 Bad Request`: Invalid query parameters (e.g., invalid date format, missing `area_value`). Response body contains `Error Response Object`.
    *   `401 Unauthorized`: Request lacks valid admin credentials.
    *   `403 Forbidden`: Authenticated user does not have admin privileges.
    *   `500 Internal Server Error`: Error during data aggregation.

### 6. Get Chart Data

*   **Description:** Retrieves data formatted specifically for generating graphs/charts based on various criteria.
*   **Endpoint:** `GET /charts`
*   **Query Parameters (Required):**
    *   `chart_type` (string, Enum: `rides_per_area`, `revenue_per_driver`, `revenue_per_customer`, `rides_over_time`, ...): Specifies the type of chart data needed.
*   **Query Parameters (Optional, context-dependent based on `chart_type`):**
    *   `start_date` (string, YYYY-MM-DD): Start date for the data period.
    *   `end_date` (string, YYYY-MM-DD): End date for the data period.
    *   `area_type` (string, Enum: `city`, `zip`, `zone`, `all`): Filter data by area type.
    *   `area_value` (string): Specific area value.
    *   `driver_id` (string, SSN Format): Filter data for a specific driver.
    *   `customer_id` (string, SSN Format): Filter data for a specific customer.
    *   `time_granularity` (string, Enum: `day`, `week`, `month`): For time-series charts (e.g., `rides_over_time`). Defaults to `day`.
*   **Responses:**
    *   `200 OK`: Chart data retrieved successfully. Response body contains `ChartData Object`.
    *   `400 Bad Request`: Invalid or missing query parameters required for the specific `chart_type`. Response body contains `Error Response Object`.
    *   `401 Unauthorized`: Request lacks valid admin credentials.
    *   `403 Forbidden`: Authenticated user does not have admin privileges.
    *   `500 Internal Server Error`: Error during data aggregation or formatting.

### 7. Search Bills (Admin)

*   **Description:** Allows an administrator to search for billing records using various attributes. This likely mirrors the functionality of `GET /bills` in the Billing Service but is accessed via the admin endpoint.
*   **Endpoint:** `GET /bills`
*   **Query Parameters:** Same as `GET /bills` in `billing_service.md` (e.g., `customer_id`, `driver_id`, `payment_status`, `start_date`, `end_date`, `limit`, `offset`).
*   **Responses:**
    *   `200 OK`: List of bills retrieved. Response body contains a JSON array of `BillingInformation Object`s.
    *   `400 Bad Request`: Invalid query parameters. Response body contains `Error Response Object`.
    *   `401 Unauthorized`: Request lacks valid admin credentials.
    *   `403 Forbidden`: Authenticated user does not have admin privileges.
    *   `500 Internal Server Error`: Unexpected server error.

### 8. Display Bill Information (Admin)

*   **Description:** Allows an administrator to view the details of a specific bill. Mirrors `GET /bills/{billing_id}` in the Billing Service.
*   **Endpoint:** `GET /bills/{billing_id}`
*   **Path Parameters:**
    *   `billing_id` (string, required): The SSN format ID of the bill to display.
*   **Responses:**
    *   `200 OK`: Bill details retrieved. Response body contains `BillingInformation Object`.
    *   `400 Bad Request`: Invalid `billing_id` format. Response body contains `Error Response Object`.
    *   `401 Unauthorized`: Request lacks valid admin credentials.
    *   `403 Forbidden`: Authenticated user does not have admin privileges.
    *   `404 Not Found`: Bill not found. Response body contains `Error Response Object`.
    *   `500 Internal Server Error`: Unexpected server error.

---

## Implementation Notes

*   **Authorization:** Every endpoint in this service MUST rigorously check for administrative privileges.
*   **Data Aggregation:** The statistics and charting endpoints (`/statistics`, `/charts`) require significant backend logic to query and aggregate data, potentially across multiple database tables or even services. Performance optimization (indexing, caching, potentially pre-calculated summaries) will be crucial.
*   **Area Definition:** The system needs a consistent way to define "area" (e.g., based on zip codes, city boundaries, or predefined zones) for the statistics and charting endpoints to function correctly.
*   **Service Interaction:** Consider whether the Admin service directly accesses the database tables of other services or communicates with the other services (Driver, Customer, Billing, Rides) via their APIs or Kafka events to gather data. Direct DB access might be simpler for reads but tightly couples the services. Service-to-service communication is generally preferred in microservice architectures.