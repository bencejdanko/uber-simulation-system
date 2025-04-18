# Customer Service Documentation

## Overview

The Customer Service is responsible for managing customer profiles including personal information, contact details, payment method linkage, reviews, ratings, and ride history references.

All interactions are authenticated using Bearer tokens.

---

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install Dependencies**
   ```bash
   cd services/customer
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the `services/customer` directory. Refer to `src/config/index.ts` for all required environment variables.

4. **Run the Service**
   ```bash
   npm start
   ```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/customers` | Create a new customer and associated payment card |
| GET    | `/customers/{customer_id}` | Retrieve customer profile by ID |
| PATCH  | `/customers/{customer_id}` | Update customer profile or payment method |
| DELETE | `/customers/{customer_id}` | Delete a customer |
| GET    | `/customers` | List/search customers |

---

## Data Schema (MongoDB)

### Collection: `customers`
```json
{
  "customerId": "string",           // SSN format
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phoneNumber": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string"
  },
  "rating": "number",
  "paymentCardId": "string",        // Reference to payment_cards
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Collection: `payment_cards`
```json
{
  "paymentCardId": "string",
  "customerId": "string",
  "paymentType": "string",         // "credit", "debit", "wallet", etc.
  "last4Digits": "string",
  "cardType": "string",
  "expiryMonth": "int",
  "expiryYear": "int",
  "tokenizedId": "string"          // Tokenized securely
}
```

---

## Request/Response Examples

### Create Customer
**POST /customers**
```json
{
  "customerId": "123-45-6789",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "phoneNumber": "555-1234",
  "address": {
    "street": "123 Main St",
    "city": "San Jose",
    "state": "CA",
    "zipCode": "95112"
  },
  "paymentDetails": {
    "paymentType": "credit",
    "cardNumber": "4111111111111111",
    "expiryMonth": 12,
    "expiryYear": 2025,
    "cvv": "123"
  }
}
```

**Response**
```json
{
  "customerId": "123-45-6789",
  "paymentCard": {
    "paymentType": "credit",
    "last4Digits": "1111",
    "cardType": "Visa",
    "expiryMonth": 12,
    "expiryYear": 2025
  },
  "createdAt": "2025-04-16T08:00:00Z"
}
```

---

### Update Payment Info
**PATCH /customers/{customer_id}**
```json
{
  "paymentDetails": {
    "paymentType": "debit",
    "cardNumber": "5555666677778888",
    "expiryMonth": 6,
    "expiryYear": 2026,
    "cvv": "321"
  }
}
```

---

## Dependencies

- **Express** – Web server
- **ZOD** – Schema validation
- **TypeScript** – Static typing
- **Kafka** – Event-based communication

---

## Testing

Unit and integration tests can be run with:
```bash
npm test
```

---

## Security Notes

- **PCI Compliance**: Full card numbers and CVVs must not be stored. Tokenize all sensitive payment data.
- **Access Control**: Authenticated customers can only access or modify their own records.

---

## Contributing

We welcome contributions! Please fork the repo and submit a PR.

---

## License

MIT License. See LICENSE file for full details.