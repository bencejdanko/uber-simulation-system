const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  _id: { type: String, match: /^\d{3}-\d{2}-\d{4}$/, required: true },
  reviewerId: { type: String, match: /^\d{3}-\d{2}-\d{4}$/ },
  revieweeId: { type: String, match: /^\d{3}-\d{2}-\d{4}$/ },
  reviewerType: String,
  revieweeType: String,
  rating: Number,
  comment: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', ReviewSchema);
