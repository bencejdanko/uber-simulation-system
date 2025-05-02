const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  _id: { type: String, match: /^\d{3}-\d{2}-\d{4}$/, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Admin', AdminSchema);
