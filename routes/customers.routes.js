const express = require('express');
const router = express.Router();

// GET /api/v1/admin/customers
router.get('/', (req, res) => {
  res.json({ message: 'Customers API endpoint' });
});

module.exports = router; 