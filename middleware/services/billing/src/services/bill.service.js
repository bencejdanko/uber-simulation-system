const Bill = require('../models/bill.model');
const pricingService = require('./pricing.service');
const { v4: uuidv4 } = require('uuid');
const { SSNGenerator } = require('../utils/ssn-generator');

// Mock Redis client for testing purposes
const redisClient = {
  get: async () => null,
  set: async () => 'OK',
  del: async () => 1,
  exists: async () => 0,
  expire: async () => 1
};

console.log('Using mock Redis client in bill service');

/**
 * Generate a unique billing ID in SSN format
 * @returns {Promise<string>} - Unique billing ID
 */
const generateBillingId = async () => {
  // Use the SSN generator utility
  return SSNGenerator.generate();
};

/**
 * Create a new bill
 * @param {Object} billData - Bill data
 * @returns {Promise<Object>} - Created bill
 */
const createBill = async (billData) => {
  try {
    // Generate a unique billing ID if not provided
    if (!billData.billingId) {
      billData.billingId = await generateBillingId();
    }
    
    // Create a new bill
    const bill = new Bill(billData);
    
    // Save the bill to the database
    await bill.save();
    
    // Invalidate any related cache
    await invalidateBillCache(bill.customerId);
    await invalidateBillCache(bill.driverId);
    
    return bill;
  } catch (error) {
    console.error('Error creating bill:', error);
    throw error;
  }
};

/**
 * Create a bill from a completed ride
 * @param {Object} rideData - Completed ride data
 * @returns {Promise<Object>} - Created bill
 */
const createBillFromRide = async (rideData) => {
  try {
    // Calculate the actual fare
    const fareDetails = await pricingService.calculateActualFare(rideData);
    
    // Prepare bill data
    const billData = {
      billingId: await generateBillingId(),
      rideId: rideData.rideId,
      customerId: rideData.customerId,
      driverId: rideData.driverId,
      date: new Date(rideData.dropoffTimestamp),
      pickupTime: new Date(rideData.pickupTimestamp),
      dropoffTime: new Date(rideData.dropoffTimestamp),
      distanceCovered: fareDetails.breakdown.actualDistance,
      sourceLocation: {
        latitude: rideData.pickupLocation.latitude || rideData.pickupLocation.coordinates[1],
        longitude: rideData.pickupLocation.longitude || rideData.pickupLocation.coordinates[0],
        addressLine: rideData.pickupLocation.addressLine
      },
      destinationLocation: {
        latitude: rideData.dropoffLocation.latitude || rideData.dropoffLocation.coordinates[1],
        longitude: rideData.dropoffLocation.longitude || rideData.dropoffLocation.coordinates[0],
        addressLine: rideData.dropoffLocation.addressLine
      },
      predictedAmount: rideData.predictedFare,
      actualAmount: fareDetails.fare,
      paymentStatus: 'PENDING',
      fareBreakdown: {
        baseAmount: fareDetails.breakdown.baseAmount,
        distanceAmount: fareDetails.breakdown.distanceAmount,
        timeAmount: fareDetails.breakdown.timeAmount,
        surge: fareDetails.breakdown.surge,
        taxes: fareDetails.breakdown.taxes,
        driverPayout: fareDetails.breakdown.driverPayout,
        platformFee: fareDetails.breakdown.platformFee
      }
    };
    
    // Create the bill
    return await createBill(billData);
  } catch (error) {
    console.error('Error creating bill from ride:', error);
    throw error;
  }
};

/**
 * Get a bill by ID
 * @param {string} billingId - Bill ID
 * @returns {Promise<Object>} - Bill
 */
const getBillById = async (billingId) => {
  try {
    // Check if the bill is in cache
    const cacheKey = `bill:${billingId}`;
    const cachedBill = await redisClient.get(cacheKey);
    
    if (cachedBill) {
      return JSON.parse(cachedBill);
    }
    
    // If not in cache, get from database
    const bill = await Bill.findOne({ billingId });
    
    if (!bill) {
      throw new Error('Bill not found');
    }
    
    // Cache the bill for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(bill), 'EX', 300);
    
    return bill;
  } catch (error) {
    console.error(`Error getting bill ${billingId}:`, error);
    throw error;
  }
};

/**
 * Search bills based on criteria
 * @param {Object} criteria - Search criteria
 * @param {number} limit - Maximum number of results
 * @param {number} offset - Number of results to skip
 * @returns {Promise<Object>} - Bills and count
 */
const searchBills = async (criteria, limit = 20, offset = 0) => {
  try {
    // Build the query
    const query = {};
    
    // Add criteria to query
    if (criteria.customer_id) {
      query.customerId = criteria.customer_id;
    }
    
    if (criteria.driver_id) {
      query.driverId = criteria.driver_id;
    }
    
    if (criteria.ride_id) {
      query.rideId = criteria.ride_id;
    }
    
    if (criteria.payment_status) {
      query.paymentStatus = criteria.payment_status;
    }
    
    // Add date range if provided
    if (criteria.start_date || criteria.end_date) {
      query.date = {};
      
      if (criteria.start_date) {
        query.date.$gte = new Date(criteria.start_date);
      }
      
      if (criteria.end_date) {
        query.date.$lte = new Date(criteria.end_date);
      }
    }
    
    // Check if we have this query cached
    const cacheKey = `bills:${JSON.stringify(query)}:${limit}:${offset}`;
    const cachedResult = await redisClient.get(cacheKey);
    
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }
    
    // If not in cache, query the database
    const bills = await Bill.find(query)
      .sort({ date: -1 })
      .skip(offset)
      .limit(limit);
    
    const count = await Bill.countDocuments(query);
    
    const result = {
      bills,
      count,
      limit,
      offset
    };
    
    // Cache the result for 1 minute
    await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 60);
    
    return result;
  } catch (error) {
    console.error('Error searching bills:', error);
    throw error;
  }
};

/**
 * Delete a bill
 * @param {string} billingId - Bill ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteBill = async (billingId) => {
  try {
    // Get the bill first to invalidate cache later
    const bill = await Bill.findOne({ billingId });
    
    if (!bill) {
      throw new Error('Bill not found');
    }
    
    // Delete the bill
    await Bill.deleteOne({ billingId });
    
    // Invalidate cache
    await redisClient.del(`bill:${billingId}`);
    await invalidateBillCache(bill.customerId);
    await invalidateBillCache(bill.driverId);
    
    return true;
  } catch (error) {
    console.error(`Error deleting bill ${billingId}:`, error);
    throw error;
  }
};

/**
 * Update bill payment status
 * @param {string} billingId - Bill ID
 * @param {string} status - New payment status
 * @param {Object} paymentDetails - Payment details
 * @returns {Promise<Object>} - Updated bill
 */
const updatePaymentStatus = async (billingId, status, paymentDetails = {}) => {
  try {
    // Get the bill
    const bill = await Bill.findOne({ billingId });
    
    if (!bill) {
      throw new Error('Bill not found');
    }
    
    // Update the payment status
    bill.paymentStatus = status;
    
    // Update payment details if provided
    if (paymentDetails.method) {
      bill.paymentDetails = {
        ...bill.paymentDetails,
        ...paymentDetails
      };
    }
    
    // Save the updated bill
    await bill.save();
    
    // Invalidate cache
    await redisClient.del(`bill:${billingId}`);
    await invalidateBillCache(bill.customerId);
    await invalidateBillCache(bill.driverId);
    
    return bill;
  } catch (error) {
    console.error(`Error updating payment status for bill ${billingId}:`, error);
    throw error;
  }
};

/**
 * Get revenue statistics
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} groupBy - Group by (day, week, month)
 * @returns {Promise<Array>} - Revenue statistics
 */
const getRevenueStats = async (startDate, endDate, groupBy = 'day') => {
  try {
    // Define the date format for grouping
    let dateFormat;
    let dateField;
    
    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        dateField = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
        break;
      case 'week':
        dateFormat = '%Y-%U';
        dateField = { $dateToString: { format: '%Y-%U', date: '$date' } };
        break;
      case 'month':
        dateFormat = '%Y-%m';
        dateField = { $dateToString: { format: '%Y-%m', date: '$date' } };
        break;
      default:
        dateFormat = '%Y-%m-%d';
        dateField = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
    }
    
    // Check if we have this query cached
    const cacheKey = `revenue:${startDate.toISOString()}:${endDate.toISOString()}:${groupBy}`;
    const cachedResult = await redisClient.get(cacheKey);
    
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }
    
    // If not in cache, query the database
    const stats = await Bill.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          paymentStatus: 'PAID'
        }
      },
      {
        $group: {
          _id: dateField,
          totalRevenue: { $sum: '$actualAmount' },
          count: { $sum: 1 },
          avgFare: { $avg: '$actualAmount' },
          totalDistance: { $sum: '$distanceCovered' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Cache the result for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(stats), 'EX', 300);
    
    return stats;
  } catch (error) {
    console.error('Error getting revenue stats:', error);
    throw error;
  }
};

/**
 * Invalidate bill cache for a user
 * @param {string} userId - User ID (customer or driver)
 */
const invalidateBillCache = async (userId) => {
  try {
    // Get all cache keys related to this user
    const customerKeys = await redisClient.keys(`bills:*"customer_id":"${userId}"*`);
    const driverKeys = await redisClient.keys(`bills:*"driver_id":"${userId}"*`);
    
    // Delete all matching keys
    const keys = [...customerKeys, ...driverKeys];
    
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error(`Error invalidating bill cache for user ${userId}:`, error);
    // Don't throw, just log the error
  }
};

module.exports = {
  createBill,
  createBillFromRide,
  getBillById,
  searchBills,
  deleteBill,
  updatePaymentStatus,
  getRevenueStats
};