const express = require('express');
const router = express.Router();

// GET /api/v1/admin/rides
router.get('/', (req, res) => {
  res.json({ message: 'Rides API endpoint' });
});

module.exports = router; 