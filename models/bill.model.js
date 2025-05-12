const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const billSchema = new mongoose.Schema({
  rideId: {
    type: Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  },
  customer: {
    type: String,
    required: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  driver: {
    type: String,
    required: true
  },
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  source: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CREDIT_CARD', 'WALLET'],
    default: 'CASH'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  }
}, { timestamps: true });

// Create a virtual 'id' field for API compatibility
billSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Always include virtuals when converting to JSON
billSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Generate bill ID
billSchema.pre('save', async function(next) {
  if (this.isNew && !this.billId) {
    try {
      // Find the last bill to increment the ID
      const lastBill = await this.constructor.findOne({}, {}, { sort: { 'billId': -1 } });
      if (lastBill && lastBill.billId && lastBill.billId.match(/^B\d{6}$/)) {
        const lastNumber = parseInt(lastBill.billId.substring(1), 10);
        this.billId = `B${(lastNumber + 1).toString().padStart(6, '0')}`;
      } else {
        this.billId = 'B000001';
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
billSchema.index({ billId: 1 });

const Bill = mongoose.model('Bill', billSchema);

module.exports = Bill; 