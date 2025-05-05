// src/services/statistics.service.js
const Ride = require('../models/ride.model');
const Billing = require('../models/billing.model');

const getAggregatedData = async ({ start_date, end_date, area_type }) => {
  // Perform data aggregation
  const aggregationPipeline = [
    {
      $match: {
        date: { $gte: start_date, $lte: end_date },
        ...(area_type && { areaType: area_type }) // Optional filter
      }
    },
    {
      $group: {
        _id: null,
        totalRides: { $sum: 1 },
        totalRevenue: { $sum: '$actualAmount' },
        averageRideDistance: { $avg: '$distanceCovered' }
      }
    }
  ];

  const aggregatedData = await Ride.aggregate(aggregationPipeline);
  const totalBills = await Billing.aggregate([
    { $match: { date: { $gte: start_date, $lte: end_date } } },
    { $group: { _id: null, totalBills: { $sum: 1 }, totalAmount: { $sum: '$actualAmount' } } }
  ]);

  return {
    rides: aggregatedData,
    billing: totalBills[0] || { totalBills: 0, totalAmount: 0 }
  };
};

module.exports = { getAggregatedData };
