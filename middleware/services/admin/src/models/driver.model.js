const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  driverId: {
    type: String,
    required: true,
    match: /^\d{3}-\d{2}-\d{4}$/,
    unique: true
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  phoneNumber: String,
  email: { type: String, required: true, match: /\S+@\S+\.\S+/ },
  carDetails: {
    make: String,
    model: String,
    year: Number,
    color: String,
    licensePlate: String
  },
  introduction: {
    imageUrl: String,
    videoUrl: String
  }
});

module.exports = mongoose.model('Driver', driverSchema);
