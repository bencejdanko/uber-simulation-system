const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  reviewerId: String,
  revieweeId: String,
  reviewerType: String,
  revieweeType: String,
  rating: Number,
  comment: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', ReviewSchema);
