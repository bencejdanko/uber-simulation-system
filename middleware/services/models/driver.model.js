const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  _id: { type: String, match: /^\d{3}-\d{2}-\d{4}$/, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, match: /.+@.+\..+/ },
  phoneNumber: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: { type: String, match: /^\d{5}(-\d{4})?$/ }
  },
  carDetails: {
    make: String,
    model: String,
    year: Number,
    color: String,
    licensePlate: String
  },
  rating: { type: Number, default: 5.0 },
  introduction: {
    imageUrl: String,
    videoUrl: String
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    timestamp: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Driver', DriverSchema);
