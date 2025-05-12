const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  make: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true
  }
});

const driverSchema = new mongoose.Schema({
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
  carDetails: {
    type: carSchema,
    required: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
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

// Virtual for driver's full name
driverSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for rides (will populate in queries)
driverSchema.virtual('rides', {
  ref: 'Ride',
  localField: '_id',
  foreignField: 'driverId'
});

// Virtual for reviews (will populate in queries)
driverSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'driverId'
});

// Index for faster querying
driverSchema.index({ city: 1, state: 1 });
driverSchema.index({ status: 1 });
driverSchema.index({ email: 1 });

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver; 