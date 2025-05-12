// src/controllers/admin.controller.js
// To call this API, you would send a request like:
// GET /api/v1/admin/statistics?start_date=2023-01-01&end_date=2023-01-31&area_type=urban
// This will return statistics for the specified date range and area type.
// {
//  "totalRides": 150,
//  "totalDistance": 500,
//  "averageFare": 20.5
//}

const StatisticsService = require('../services/statistics.service');
const cache = require('../utils/cache'); // Assuming you have some caching utility (e.g., Redis)
const { Customer } = require('../models/customer.model');
const { Driver } = require('../models/driver.model');
const { Ride } = require('../models/ride.model');
const { Billing } = require('../models/billing.model');
const mongoose = require('mongoose');

exports.getStatistics = async (req, res) => {
  const { start_date, end_date, area_type } = req.query;

  // Validate query parameters
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date are required' });
  }

  try {
    // Construct a unique cache key based on the request parameters
    const cacheKey = `statistics-${start_date}-${end_date}-${area_type}`;

    // Check if the statistics data is cached in Redis
    const cachedStats = await cache.get(cacheKey);

    // If cached data exists, return it from the cache
    if (cachedStats) {
      return res.status(200).json(JSON.parse(cachedStats));
    }

    // If data is not in the cache, fetch it from the StatisticsService
    const stats = await StatisticsService.getAggregatedData({ start_date, end_date, area_type });

    // Prepare the response payload
    const responsePayload = {
      data: stats,
      startDate: start_date,
      endDate: end_date,
      areaType: area_type
    };

    // Cache the statistics data for future use (with a TTL of 1 hour)
    await cache.set(cacheKey, JSON.stringify(responsePayload), { ttl: 3600 });

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error('Error fetching statistics:', err);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

/**
 * Get overview statistics for the admin dashboard
 * This includes total rides, total revenue, active/inactive drivers and customers
 */
exports.getOverviewStats = async (req, res) => {
  try {
    // Create a cache key based on the current date to refresh daily
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `overview-stats-${today}`;

    // Check if data is in cache
    const cachedStats = await cache.get(cacheKey);
    if (cachedStats) {
      return res.status(200).json(JSON.parse(cachedStats));
    }

    // Calculate the date 30 days ago for "active" status
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get total rides count
    const totalRides = await Ride.countDocuments();

    // Get total revenue
    const totalRevenueAgg = await Billing.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ]);
    const totalRevenue = totalRevenueAgg.length > 0 ? totalRevenueAgg[0].totalRevenue : 0;

    // Count drivers
    const totalDrivers = await Driver.countDocuments();
    const activeDrivers = await Driver.countDocuments({
      lastActive: { $gte: thirtyDaysAgo }
    });

    // Count customers
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({
      lastActive: { $gte: thirtyDaysAgo }
    });

    const stats = {
      totalRides,
      totalRevenue,
      totalDrivers,
      activeDrivers,
      totalCustomers,
      activeCustomers
    };

    // Cache the results
    await cache.set(cacheKey, JSON.stringify(stats), { ttl: 3600 }); // 1 hour TTL

    return res.status(200).json(stats);
  } catch (err) {
    console.error('Error fetching overview statistics:', err);
    return res.status(500).json({ error: 'Failed to fetch overview statistics' });
  }
};

/**
 * Get ride distribution by time of day
 * Returns hourly ride counts
 */
exports.getRidesByHour = async (req, res) => {
  try {
    const { timeRange = 'daily' } = req.query;
    
    // Determine date range based on timeRange
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'daily':
      default:
        startDate.setDate(startDate.getDate() - 1);
        break;
    }

    // Cache key
    const cacheKey = `rides-by-hour-${timeRange}-${startDate.toISOString().split('T')[0]}`;
    
    // Check cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    // Aggregate rides by hour
    const ridesByHour = await Ride.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          rides: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          hour: "$_id",
          rides: 1
        }
      },
      {
        $sort: { hour: 1 }
      }
    ]);

    // Fill in missing hours with zero rides
    const result = Array.from({ length: 24 }, (_, i) => {
      const found = ridesByHour.find(item => item.hour === i);
      return { hour: i, rides: found ? found.rides : 0 };
    });

    // Cache results
    await cache.set(cacheKey, JSON.stringify(result), { ttl: 1800 }); // 30 minutes TTL

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching rides by hour:', err);
    return res.status(500).json({ error: 'Failed to fetch rides by hour' });
  }
};

/**
 * Get ride distribution by city/region
 */
exports.getRidesByCity = async (req, res) => {
  try {
    const { timeRange = 'daily' } = req.query;
    
    // Determine date range based on timeRange
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'daily':
      default:
        startDate.setDate(startDate.getDate() - 1);
        break;
    }

    // Cache key
    const cacheKey = `rides-by-city-${timeRange}-${startDate.toISOString().split('T')[0]}`;
    
    // Check cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    // Aggregate rides by city
    const ridesByCity = await Ride.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$pickupCity", // Assuming there's a field for city
          value: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          city: "$_id",
          value: 1
        }
      },
      {
        $sort: { value: -1 }
      },
      {
        $limit: 6
      }
    ]);

    // Cache results
    await cache.set(cacheKey, JSON.stringify(ridesByCity), { ttl: 1800 }); // 30 minutes TTL

    return res.status(200).json(ridesByCity);
  } catch (err) {
    console.error('Error fetching rides by city:', err);
    return res.status(500).json({ error: 'Failed to fetch rides by city' });
  }
};
