const express = require('express');
const router = express.Router();

// GET /api/v1/admin/statistics/overview
router.get('/overview', (req, res) => {
  res.json({
    totalRides: 4827,
    totalDrivers: 321,
    totalCustomers: 1253,
    totalRevenue: 78659.45,
    activeDrivers: 298,
    activeCustomers: 876
  });
});

// GET /api/v1/admin/statistics/rides-by-city
router.get('/rides-by-city', (req, res) => {
  res.json([
    { city: "New York", value: 1245 },
    { city: "Los Angeles", value: 862 },
    { city: "Chicago", value: 573 },
    { city: "Houston", value: 421 },
    { city: "Phoenix", value: 312 },
    { city: "Philadelphia", value: 245 }
  ]);
});

// GET /api/v1/admin/statistics/rides-by-hour
router.get('/rides-by-hour', (req, res) => {
  const ridesByHour = Array.from({ length: 24 }, (_, i) => {
    let rides = 15;
    if (i >= 7 && i <= 9) rides = 60 + Math.floor(Math.random() * 30);
    else if (i >= 16 && i <= 19) rides = 85 + Math.floor(Math.random() * 40);
    else if (i >= 11 && i <= 14) rides = 45 + Math.floor(Math.random() * 20);
    else if (i >= 1 && i <= 5) rides = Math.floor(Math.random() * 15);
    return { hour: i, rides };
  });
  
  res.json(ridesByHour);
});

// GET /api/v1/admin/statistics/revenue-by-day
router.get('/revenue-by-day', (req, res) => {
  res.json([
    { day: 'Mon', revenue: 4250 },
    { day: 'Tue', revenue: 3980 },
    { day: 'Wed', revenue: 4120 },
    { day: 'Thu', revenue: 4320 },
    { day: 'Fri', revenue: 5780 },
    { day: 'Sat', revenue: 6250 },
    { day: 'Sun', revenue: 5120 }
  ]);
});

module.exports = router; 