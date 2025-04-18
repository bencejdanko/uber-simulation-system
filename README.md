# Uber Simulation - Distributed Systems for Data Engineering

## Project Overview

This project simulates the core functionalities of the Uber system, including driver and customer management, ride booking, billing, and dynamic pricing. It is designed as a 3-tier application leveraging distributed architecture and REST-based web services.

## Team Members

* Bence Danko
* Anne Ha
* Cyril Goud Bhooma Goud
* David Thach
* Kushal Atulbhai Adhyaru
* Nairui Liu

## Project Due Dates

*   **API Design Document:** April 10th, 2025
*   **Presentation and Demo:** May 5th and May 12th, 2025

## Getting Started

1.  **Clone the repository:** `git clone [repository URL]`
2.  **Setup development environment:** Follow the instructions in [docs/development_setup.md](docs/development_setup.md)
3.  **Install project dependencies:** `[Command for installing dependencies, e.g., npm install, pip install -r requirements.txt]`

## Documentation

This project follows a comprehensive documentation approach to ensure clarity, maintainability, and ease of understanding for all team members. All project documentation is located in the `/docs` directory.

### /docs Directory Structure

*   **/api/**:
    *   API design specifications for all web services.
        *   **/api/driver_service.md:** API specification for all driver-related operations.
        *   **/api/customer_service.md:** API specification for all customer-related operations.
        *   **/api/billing_service.md:** API specification for all billing-related operations.
        *   **/api/admin_service.md:** API specification for all admin-related operations.
        *   **/api/rides_service.md:** API specification for all ride-related operations.
*   **/database/**:
    *   Database schema designs and creation scripts.
        *   **/database/schema.md:** Detailed database schema (tables, columns, data types, relationships).
        *   **/database/creation_scripts.md:** Scripts used to create the database and initial data.
*   **/architecture/**:
    *   Diagrams and explanations of the system architecture.
        *   **/architecture/system_diagram.md:** A high-level system architecture diagram explaining how the 3 tiers are integrated.
        *   **/architecture/deployment.md:** Detailed description of the deployment setup.
*   **/pricing/**:
    *   Documentation for the dynamic pricing algorithm.
        *   **/pricing/algorithm_description.md:** Detailed explanation of the dynamic pricing algorithm.
        *   **/pricing/kaggle_integration.md:** How the Kaggle dataset is used.
*   **/scalability/**:
    *   Details about scalability strategies and testing.
        *   **/scalability/caching_strategy.md:** Caching mechanisms used (e.g., Redis).
        *   **/scalability/performance_tests.md:** Documentation on how the system was stress tested.
*   **/testing/**:
    *   Information about unit and integration testing.
        *   **/testing/test_plan.md:** The test plan and comprehensive list of tests for each operation.
        *   **/testing/test_results.md:** Results of all test cases, with information on passed and failed tests, along with any fixes or updates made to resolve them.
*   **/development_setup.md:** Instructions for setting up the development environment.
*   **/project_plan.md:** Initial plan breaking down tasks and assignments to the team
*   **/meeting_minutes/**:
    *   Notes for the progress each week by the group.
        *   **/meeting_minutes/week1.md:** All meeting notes will be written here for this and future weeks for each meeting.

## Project Structure

```
UberSimulation/
├── README.md # This file
├── docs/ # Documentation directory
│ ├── api/ # API specifications
│ ├── database/ # Database schema
│ ├── architecture/ # Architecture diagrams
│ ├── pricing/ # Dynamic Pricing Algorithm documentation
│ ├── scalability/
│ ├── testing/
│ ├── meeting_minutes/
│ ├── development_setup.md #Instructions for the development enviroment
│ ├── project_plan.md
├── client/ # Client-side application code
├── middleware/ # Middleware/Web services code
├── database/ # Database related scripts and configs
├── scripts/ # Utility/helper scripts
└── ...
```

## Contributions

We will be documenting each member's contributions throughout this project, providing transparency and accountability.

### Contribution Tracking

We'll maintain a record of individual contributions:

*   **Commit Messages:** Use clear and descriptive commit messages following the format:
    `[Module]: Brief description of the change`. Example: `[DriverService]: Implement createDriver endpoint`
*   **Contribution Log:** Each team member will update the list of activities they are performing each week with the list of documents they plan to create or have completed.
    *   **Team member 1:**
        *   Week 1:
            *   Activities
                *   Created and managed repository.
                *   Setup project structure.
                *   Wrote basic tests.
            *   Deliverables
                *   Created `README.md` file.
                *   Setup basic test class.
            *   Documents
                *   [/docs/api/driver_service.md](docs/api/driver_service.md): Initial design for `DriverService` API.
*   **Meeting Minutes:** Discussions on project tasks and contributions are recorded during team meetings
    *   **Week 1:**
        *   Project setup and configuration
        *   Initial setup of database and design for schema

## Task Breakdown

To ensure efficient and coordinated development, we've broken down the project into specific tasks for each tier, identifying key dependencies.

**Tier 1 (Client) - [Assigned To: David, Anne]**

*   **Subtasks:**
    *   [ ] **UI Design & Development:**
        *   [ ] Implement driver module UI.
        *   [ ] Implement customer module UI.
        *   [ ] Implement billing module UI.
        *   [ ] Implement admin module UI.
        *   [ ] Implement rides module UI.
        *   [ ] Implement error handling and status display.
    *   [ ] **API Integration:**
        *   [ ] Implement functions to call Driver Service APIs.
        *   [ ] Implement functions to call Customer Service APIs.
        *   [ ] Implement functions to call Billing Service APIs.
        *   [ ] Implement functions to call Admin Service APIs.
        *   [ ] Implement functions to call Rides Service APIs.
    *   [ ] **User Input Validation:**
        *   [ ] Implement validation for driver input fields.
        *   [ ] Implement validation for customer input fields.
        *   [ ] Implement validation for billing input fields.
        *   [ ] Implement validation for admin input fields.
        *   [ ] Implement validation for rides input fields.
    *   [ ] **Image/Video Handling:**
        *   [ ] Implement UI for uploading driver intro images/videos.
        *   [ ] Implement UI for uploading customer ride images.
*   **Dependencies:**
    *   API design specifications from the Middleware team (Tier 2).
    *   Database Schemas from the Database team (Tier 3) - (to understand data structures for display).

**Tier 2 (Middleware) - [Assigned To: Bence, Cyril]**

*   **Subtasks:**
    *   [x] **API Design:**
        *   [x] Design REST APIs for Driver Service.
        *   [x] Design REST APIs for Customer Service.
        *   [x] Design REST APIs for Billing Service.
        *   [x] Design REST APIs for Admin Service.
        *   [x] Design REST APIs for Rides Service.
    *   [ ] **Service Implementation:**
        *   [ ] Implement Driver Service endpoints.
        *   [ ] Implement Customer Service endpoints.
        *   [ ] Implement Billing Service endpoints.
        *   [ ] Implement Admin Service endpoints.
        *   [ ] Implement Rides Service endpoints.
    *   [ ] **Database Interaction:**
        *   [ ] Implement data access layer for Driver data.
        *   [ ] Implement data access layer for Customer data.
        *   [ ] Implement data access layer for Billing data.
        *   [ ] Implement data access layer for Admin data.
        *   [ ] Implement data access layer for Rides data.
    *   [ ] **Kafka Integration:**
        *   [ ] Configure Kafka producers for relevant events.
        *   [ ] Configure Kafka consumers for relevant events.
    *   [ ] **Dynamic Pricing Algorithm:**
        *   [ ] Implement pricing logic within the Rides Service.
        *   [ ] Integrate with the Kaggle dataset.
*   **Dependencies:**
    *   Database Schemas from the Database team (Tier 3).
    *   Agreement on data structures and event formats with the Client team (Tier 1) for API responses.

**Tier 3 (Database) - [Assigned To: Kushal, Nairui]**

*   **Subtasks:**
    *   [ ] **Schema Design:**
        *   [ ] Design schema for Driver table.
        *   [ ] Design schema for Customer table.
        *   [ ] Design schema for Billing table.
        *   [ ] Design schema for Admin table.
        *   [ ] Design schema for Rides table.
    *   [ ] **Database Creation:**
        *   [ ] Create the database.
        *   [ ] Create all necessary tables.
        *   [ ] Implement initial data loading (if needed).
    *   [ ] **SQL/NoSQL Configuration:**
        *   [ ] Configure MySQL/MongoDB for data storage.
        *   [ ] Configure storage of images, videos and user data.
    *   [ ] **Performance Optimization:**
        *   [ ] Implement database indexing.
        *   [ ] Configure connection pooling.
        *   [ ] Implement caching strategies (with Redis).
*   **Dependencies:**
    *   Agreement on data requirements with the Middleware team (Tier 2).

## Technologies Used

*   [List of Technologies, e.g., Node.js, Python, MySQL, REST, Kafka, Redis, Docker, Kubernetes, AWS]

## License

[]