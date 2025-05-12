const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
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
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  carDetails: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
    default: 'ACTIVE'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ridesCount: {
    type: Number,
    default: 0
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  }
}, { timestamps: true });

// Create a virtual 'id' field for API compatibility
driverSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Create index for geospatial queries
driverSchema.index({ location: '2dsphere' });

// Always include virtuals when converting to JSON
driverSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver; 