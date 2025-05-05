// src/services/chart.service.js
const Bill = require('../models/billing.model');
const Ride = require('../models/ride.model');

exports.getChartData = async ({ chart_type, start_date, end_date, filters }) => {
  try {
    // Aggregation logic based on chart_type, date range, and filters

    let chartData;

    switch (chart_type) {
      case 'ride_volume':
        // Example: Aggregating ride volume over the specified date range
        chartData = await Ride.aggregate([
          { $match: { requestTimestamp: { $gte: new Date(start_date), $lte: new Date(end_date) } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$requestTimestamp" } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]);
        break;

      case 'total_revenue':
        // Example: Calculating total revenue over the specified date range
        chartData = await Bill.aggregate([
          { $match: { paymentTimestamp: { $gte: new Date(start_date), $lte: new Date(end_date) } } },
          { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
        ]);
        break;

      // Add more cases for different chart types here as needed...

      default:
        throw new Error('Invalid chart_type');
    }

    return chartData;
  } catch (err) {
    throw new Error('Error fetching chart data: ' + err.message);
  }
};
