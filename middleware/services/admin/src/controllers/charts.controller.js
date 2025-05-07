const ChartService = require('../services/chart.service');
const cache = require('../utils/cache'); // Caching utility (e.g., Redis)

exports.getChartData = async (req, res) => {
  const { chart_type, start_date, end_date, filters } = req.query;

  // Validate required parameters
  if (!chart_type) {
    return res.status(400).json({ error: 'chart_type is required' });
  }

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date are required' });
  }

  try {
    // Construct a unique cache key based on the request parameters
    const cacheKey = `chart-${chart_type}-${start_date}-${end_date}-${filters}`;

    // Check the cache first
    const cachedData = await cache.get(cacheKey);

    // If data is cached, return it directly
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    // If not cached, fetch the chart data using the service
    const chartData = await ChartService.getChartData({ chart_type, start_date, end_date, filters });

    // Prepare the response payload
    const responsePayload = {
      data: chartData,
      chartType: chart_type
    };

    // Cache the result for future requests (set TTL to 1 hour)
    await cache.set(cacheKey, JSON.stringify(responsePayload), { ttl: 3600 });

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error('Error fetching chart data:', err);
    return res.status(500).json({ error: 'Failed to fetch chart data' });
  }
};
