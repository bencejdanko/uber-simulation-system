const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the customer schema
const customerSchema = new Schema(
  {
    customerId: {
    type: String,
    required: true,
    match: /^\d{3}-\d{2}-\d{4}$/,
    unique: true
  },
  firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true, match: /^\d{5}(?:[-\s]\d{4})?$/ }  // Zip code validation (e.g., 12345 or 12345-6789)
    },
    phoneNumber: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      match: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/  // Email format validation
    },
    creditCardDetails: {
      last4Digits: {
        type: String,
        required: true,
        match: /^\d{4}$/  // Ensure it is exactly 4 digits
      },
      cardType: {
        type: String,
        required: true,
        enum: ['Visa', 'MasterCard', 'American Express', 'Discover']  // Limiting to common card types
      },
      expiryMonth: {
        type: Number,
        required: true,
        min: 1,
        max: 12
      },
      expiryYear: {
        type: Number,
        required: true
      }
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5  // Default rating for customers
    },
    reviews: [
      {
        reviewId: { type: String },
        driverId: { type: String },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    ridesHistory: [
      {
        rideId: { type: String },
        date: { type: Date },
        fare: { type: Number }
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }  // Automatically manages createdAt and updatedAt fields
);

// Create the Customer model
const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
