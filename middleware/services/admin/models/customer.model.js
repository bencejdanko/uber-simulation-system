const mongoose = require('mongoose');

const creditCardSchema = new mongoose.Schema({
  cardNumber: {
    type: String,
    required: true,
    // Store last 4 digits only for security
    match: /^\*{12}\d{4}$/
  },
  cardholderName: {
    type: String,
    required: true
  },
  expirationMonth: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  expirationYear: {
    type: Number,
    required: true
  },
  // Don't store CVV for security reasons
  brand: {
    type: String,
    required: true,
    enum: ['visa', 'mastercard', 'amex', 'discover']
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const customerSchema = new mongoose.Schema({
  _id: {
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
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true,
    match: /^[A-Z]{2}$/
  },
  zipCode: {
    type: String,
    required: true,
    match: /^\d{5}(-\d{4})?$/
  },
  creditCards: {
    type: [creditCardSchema],
    default: []
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for customer's full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for rides (will populate in queries)
customerSchema.virtual('rides', {
  ref: 'Ride',
  localField: '_id',
  foreignField: 'customerId'
});

// Virtual for reviews given (will populate in queries)
customerSchema.virtual('reviewsGiven', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'customerId'
});

// Indexes for faster querying
customerSchema.index({ city: 1, state: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ email: 1 });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer; 