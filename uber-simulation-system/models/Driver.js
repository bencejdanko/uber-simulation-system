const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
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
  carDetails: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
    default: 'ACTIVE',
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  ridesCount: {
    type: Number,
    default: 0,
  },
  location: {
    type: {
      type: String,
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
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
DriverSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Create index for geospatial queries
DriverSchema.index({ location: '2dsphere' });

// Always include virtuals when converting to JSON
DriverSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Driver', DriverSchema); 