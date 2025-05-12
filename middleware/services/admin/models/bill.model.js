const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    match: /^B\d{6}$/,
    unique: true
  },
  rideId: {
    type: String,
    ref: 'Ride',
    required: true,
    unique: true
  },
  customerId: {
    type: String,
    ref: 'Customer',
    required: true
  },
  driverId: {
    type: String,
    ref: 'Driver',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  pickupTime: {
    type: Date,
    required: true
  },
  dropoffTime: {
    type: Date,
    required: true
  },
  distance: {
    type: Number, // in miles
    required: true,
    min: 0
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 0
  },
  baseFare: {
    type: Number,
    required: true,
    min: 0
  },
  distanceFare: {
    type: Number,
    required: true,
    min: 0
  },
  timeFare: {
    type: Number,
    required: true,
    min: 0
  },
  surge: {
    type: Number,
    required: true,
    default: 1.0,
    min: 1.0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  tip: {
    type: Number,
    default: 0,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'disputed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'wallet', 'cash'],
    required: true
  },
  source: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Generate bill ID
billSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Find the last bill to increment the ID
      const lastBill = await this.constructor.findOne({}, {}, { sort: { '_id': -1 } });
      if (lastBill) {
        const lastNumber = parseInt(lastBill._id.substring(1), 10);
        this._id = `B${(lastNumber + 1).toString().padStart(6, '0')}`;
      } else {
        this._id = 'B000001';
      }
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Indexes for faster querying
billSchema.index({ customerId: 1 });
billSchema.index({ driverId: 1 });
billSchema.index({ date: -1 });
billSchema.index({ status: 1 });

const Bill = mongoose.model('Bill', billSchema);

module.exports = Bill; 