const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  driverId: { type: String },
  status: {
    type: String,
    enum: ['REQUESTED', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'REQUESTED'
  },
  pickupLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(val) {
          // Longitude between -180 and 180, Latitude between -90 and 90
          return val[0] >= -180 && val[0] <= 180 && val[1] >= -90 && val[1] <= 90;
        },
        message: 'Invalid coordinates'
      }
    }
  },
  dropoffLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(val) {
          // Longitude between -180 and 180, Latitude between -90 and 90
          return val[0] >= -180 && val[0] <= 180 && val[1] >= -90 && val[1] <= 90;
        },
        message: 'Invalid coordinates'
      }
    }
  },
  vehicleType: {
    type: String,
    enum: ['STANDARD', 'PREMIUM', 'LUXURY'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CREDIT_CARD', 'PAYPAL'],
    required: true
  },
  estimatedFare: { type: Number, default: 0 },
  actualFare: { type: Number, default: 0 },
  cancellationReason: { type: String }
}, {
  timestamps: true
});

// Create geospatial index for pickup location and dropoff location
RideSchema.index({ 'pickupLocation': '2dsphere' });
RideSchema.index({ 'dropoffLocation': '2dsphere' });

// Create compound index for status and driverId
RideSchema.index({ status: 1, driverId: 1 });

// Create compound index for status and customerId
RideSchema.index({ status: 1, customerId: 1 });

const Ride = mongoose.model('Ride', RideSchema);

module.exports = Ride;  // CommonJS syntax for exporting
