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
