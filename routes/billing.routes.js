const express = require('express');
const router = express.Router();

// GET /api/v1/admin/bills
router.get('/', (req, res) => {
  res.json({ message: 'Billing API endpoint' });
});

module.exports = router; 