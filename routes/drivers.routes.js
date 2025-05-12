const express = require('express');
const router = express.Router();

// GET /api/v1/admin/drivers
router.get('/', (req, res) => {
  res.json({ message: 'Drivers API endpoint' });
});

module.exports = router; 