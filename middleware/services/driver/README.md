# Driver Service Documentation

## Overview

The Driver Service is responsible for managing driver profiles, including creation, retrieval, updates, deletion, and searching. It handles driver information such as personal details, contact information, vehicle details, ratings, reviews, and location updates.

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install Dependencies**
   Navigate to the `driver` service directory and install the required dependencies:
   ```bash
   cd services/driver
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the `services/driver` directory and set the necessary environment variables. Refer to the `src/config/index.ts` for required variables.

4. **Run the Service**
   Start the Driver service using the following command:
   ```bash
   npm start
   ```

## Usage

The Driver Service exposes a RESTful API for managing driver profiles. All endpoints require authentication via Bearer tokens.

### API Endpoints

- **Create Driver**
  - `POST /drivers`
  
- **Get Driver by ID**
  - `GET /drivers/{driver_id}`
  
- **Update Driver Information**
  - `PATCH /drivers/{driver_id}`
  
- **Delete Driver**
  - `DELETE /drivers/{driver_id}`
  
- **List and Search Drivers**
  - `GET /drivers`
  
- **Update Driver Location**
  - `PATCH /drivers/{driver_id}/location`

## Dependencies

- Express: Web framework for Node.js
- ZOD: Schema validation library
- TypeScript: Superset of JavaScript for type safety
- Kafka: Messaging system for handling events

## Testing

Unit and integration tests are located in the `tests` directory. To run the tests, use the following command:
```bash
npm test
```

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.