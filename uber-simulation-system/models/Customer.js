const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
    default: 'ACTIVE',
  },
  ridesCount: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a virtual 'id' field for API compatibility
CustomerSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Always include virtuals when converting to JSON
CustomerSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Customer', CustomerSchema); 