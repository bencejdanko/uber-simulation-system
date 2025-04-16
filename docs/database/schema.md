# MongoDB Schema Documentation

This document defines the finalized MongoDB schema for the Boom Rides (Uber Simulation) System. It includes collections for Drivers, Customers, Billing, Admins, Rides, Credit Cards, and Reviews.

---

## 1. `drivers` Collection

Stores information about each registered driver.

```json
{
  "_id": "SSN-format string (e.g., 123-45-6789)",
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
  "carDetails": {
    "make": "string",
    "model": "string",
    "year": "int",
    "color": "string",
    "licensePlate": "string"
  },
  "rating": "float",
  "introduction": {
    "imageUrl": "string",
    "videoUrl": "string"
  },
  "currentLocation": {
    "type": "Point",
    "coordinates": ["float", "float"],
    "timestamp": "date"
  },
  "createdAt": "date",
  "updatedAt": "date"
}
```

---

## 2. `customers` Collection

Stores customer profile details.

```json
{
  "_id": "SSN-format string",
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
  "rating": "float",
  "creditCardId": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

---

## 3. `credit_cards` Collection

Securely stores tokenized credit card references.

```json
{
  "_id": "string",
  "customerId": "SSN-format string",
  "last4Digits": "string",
  "cardType": "string",
  "expiryMonth": "int",
  "expiryYear": "int",
  "tokenizedId": "string"
}
```

---

## 4. `rides` Collection

Stores details about each ride.

```json
{
  "_id": "string",
  "customerId": "SSN-format",
  "driverId": "SSN-format",
  "pickupLocation": {
    "type": "Point",
    "coordinates": ["float", "float"],
    "addressLine": "string"
  },
  "dropoffLocation": {
    "type": "Point",
    "coordinates": ["float", "float"],
    "addressLine": "string"
  },
  "status": "string",
  "requestTimestamp": "date",
  "acceptTimestamp": "date",
  "pickupTimestamp": "date",
  "dropoffTimestamp": "date",
  "predictedFare": "float",
  "actualFare": "float",
  "distance": "float",
  "createdAt": "date",
  "updatedAt": "date"
}
```

---

## 5. `bills` Collection

Billing information for each completed ride.

```json
{
  "_id": "string",
  "rideId": "string",
  "customerId": "SSN-format",
  "driverId": "SSN-format",
  "date": "date",
  "pickupTime": "date",
  "dropoffTime": "date",
  "distanceCovered": "float",
  "sourceLocation": {
    "latitude": "float",
    "longitude": "float",
    "addressLine": "string"
  },
  "destinationLocation": {
    "latitude": "float",
    "longitude": "float",
    "addressLine": "string"
  },
  "predictedAmount": "float",
  "actualAmount": "float",
  "paymentStatus": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

---

## 6. `admins` Collection

Stores system admin profiles.

```json
{
  "_id": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "createdAt": "date"
}
```

---

## 7. `reviews` Collection

Reviews between customers and drivers.

```json
{
  "_id": "string",
  "reviewerId": "string",
  "revieweeId": "string",
  "reviewerType": "Customer | Driver",
  "revieweeType": "Customer | Driver",
  "rating": "int",
  "comment": "string",
  "timestamp": "date"
}
```

