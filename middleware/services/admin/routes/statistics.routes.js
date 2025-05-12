const express = require('express');
const router = express.Router();
const Redis = require('ioredis');
const mongoose = require('mongoose');

// Redis client for caching
const redis = new Redis();

// Import models
const Driver = require('../models/driver.model');
const Customer = require('../models/customer.model');
const Ride = require('../models/ride.model');
const Bill = require('../models/bill.model');

// Import statistics controller
const { getOverviewStats, getRideStats, getDriverStats, getCustomerStats, getBillingStats } = require('../services/kafka.service');

// Cache middleware for API responses
const cacheMiddleware = async (req, res, next) => {
  try {
    const cacheKey = req.originalUrl;
    const cachedData = await redis.get(cacheKey);
    
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }
    
    next();
  } catch (error) {
    console.error('Redis cache error:', error);
    next();
  }
};

// GET /api/v1/admin/statistics/overview
router.get('/overview', cacheMiddleware, async (req, res) => {
  try {
    const data = await getOverviewStats();
    
    // Cache the data for 5 minutes
    await redis.set(req.originalUrl, JSON.stringify(data), 'EX', 300);
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching overview statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/v1/admin/statistics/rides-by-city
router.get('/rides-by-city', cacheMiddleware, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || 'daily';
    const stats = await getRideStats();
    
    if (!stats || !stats.ridesByCity) {
      return res.status(404).json({ error: 'Ride statistics not found' });
    }
    
    // Cache the data for 5 minutes
    await redis.set(req.originalUrl, JSON.stringify(stats.ridesByCity), 'EX', 300);
    
    res.json(stats.ridesByCity);
  } catch (error) {
    console.error('Error fetching rides by city:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/v1/admin/statistics/rides-by-hour
router.get('/rides-by-hour', cacheMiddleware, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || 'daily';
    const stats = await getRideStats();
    
    if (!stats || !stats.ridesByHour) {
      return res.status(404).json({ error: 'Ride statistics not found' });
    }
    
    // Cache the data for 5 minutes
    await redis.set(req.originalUrl, JSON.stringify(stats.ridesByHour), 'EX', 300);
    
    res.json(stats.ridesByHour);
  } catch (error) {
    console.error('Error fetching rides by hour:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/v1/admin/statistics/revenue-by-day
router.get('/revenue-by-day', cacheMiddleware, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || 'daily';
    
    // Use mock data for now, later implement actual aggregation
    const revenueByDay = [
      { day: 'Mon', revenue: 4250 },
      { day: 'Tue', revenue: 3980 },
      { day: 'Wed', revenue: 4120 },
      { day: 'Thu', revenue: 4320 },
      { day: 'Fri', revenue: 5780 },
      { day: 'Sat', revenue: 6250 },
      { day: 'Sun', revenue: 5120 }
    ];
    
    // Cache the data for 5 minutes
    await redis.set(req.originalUrl, JSON.stringify(revenueByDay), 'EX', 300);
    
    res.json(revenueByDay);
  } catch (error) {
    console.error('Error fetching revenue by day:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router; 