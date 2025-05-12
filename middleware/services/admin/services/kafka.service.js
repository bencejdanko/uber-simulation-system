/**
 * Kafka Service
 * 
 * Handles Kafka message processing for real-time updates
 */

const { sendDashboardUpdate } = require('./websocket.service');
const Driver = require('../models/driver.model');
const Customer = require('../models/customer.model');
const Ride = require('../models/ride.model');
const Bill = require('../models/bill.model');

/**
 * Initialize Kafka consumer
 * @param {Object} consumer - Kafka consumer instance
 */
const initializeKafkaConsumer = async (consumer) => {
  try {
    await consumer.connect();
    
    // Subscribe to relevant topics
    await consumer.subscribe({ 
      topics: [
        'rides', 
        'drivers', 
        'customers', 
        'bills',
        'ride.created',
        'ride.completed',
        'driver.registered',
        'customer.registered',
        'bill.generated'
      ] 
    });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          
          // Handle different types of events
          switch(topic) {
            case 'rides':
            case 'ride.created':
            case 'ride.completed':
              // Update ride statistics
              const rideStats = await getRideStats();
              sendDashboardUpdate('rides', rideStats);
              
              // Also update overview since ride count changed
              const overviewStats = await getOverviewStats();
              sendDashboardUpdate('overview', overviewStats);
              break;
              
            case 'drivers':
            case 'driver.registered':
              // Update driver statistics
              const driverStats = await getDriverStats();
              sendDashboardUpdate('drivers', driverStats);
              
              // Also update overview since driver count changed
              const driverOverviewStats = await getOverviewStats();
              sendDashboardUpdate('overview', driverOverviewStats);
              break;
              
            case 'customers':
            case 'customer.registered':
              // Update customer statistics
              const customerStats = await getCustomerStats();
              sendDashboardUpdate('customers', customerStats);
              
              // Also update overview since customer count changed
              const customerOverviewStats = await getOverviewStats();
              sendDashboardUpdate('overview', customerOverviewStats);
              break;
              
            case 'bills':
            case 'bill.generated':
              // Update billing statistics
              const billingStats = await getBillingStats();
              sendDashboardUpdate('billing', billingStats);
              
              // Also update overview since revenue changed
              const billingOverviewStats = await getOverviewStats();
              sendDashboardUpdate('overview', billingOverviewStats);
              break;
          }
        } catch (error) {
          console.error('Error processing Kafka message:', error);
        }
      },
    });
    
    console.log('Kafka consumer set up successfully');
  } catch (error) {
    console.error('Failed to set up Kafka consumer:', error);
  }
};

/**
 * Get overview statistics for admin dashboard
 */
const getOverviewStats = async () => {
  try {
    const totalRides = await Ride.countDocuments();
    const totalDrivers = await Driver.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const totalRevenue = await Bill.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const activeDrivers = await Driver.countDocuments({ status: 'active' });
    const activeCustomers = await Customer.countDocuments({ status: 'active' });

    return {
      totalRides,
      totalDrivers,
      totalCustomers,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      activeDrivers,
      activeCustomers
    };
  } catch (error) {
    console.error('Error getting overview stats:', error);
    return {
      totalRides: 0,
      totalDrivers: 0,
      totalCustomers: 0,
      totalRevenue: 0,
      activeDrivers: 0,
      activeCustomers: 0
    };
  }
};

/**
 * Get ride statistics 
 */
const getRideStats = async () => {
  try {
    // Get rides by city data
    const ridesByCity = await Ride.aggregate([
      { $group: { _id: '$pickup.city', value: { $sum: 1 } } },
      { $project: { _id: 0, city: '$_id', value: 1 } },
      { $sort: { value: -1 } },
      { $limit: 6 }
    ]);
    
    // Get rides by hour data
    const ridesByHour = await Ride.aggregate([
      { 
        $group: { 
          _id: { $hour: '$requestTime' }, 
          rides: { $sum: 1 } 
        } 
      },
      { 
        $project: { 
          _id: 0, 
          hour: '$_id', 
          rides: 1 
        } 
      },
      { $sort: { hour: 1 } }
    ]);
    
    return {
      ridesByCity,
      ridesByHour
    };
  } catch (error) {
    console.error('Error getting ride stats:', error);
    return {
      ridesByCity: [],
      ridesByHour: []
    };
  }
};

/**
 * Get driver statistics
 */
const getDriverStats = async () => {
  try {
    // Get total drivers
    const totalDrivers = await Driver.countDocuments();
    
    // Get active drivers
    const activeDrivers = await Driver.countDocuments({ status: 'active' });
    
    // Get new drivers this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newDrivers = await Driver.countDocuments({ 
      createdAt: { $gte: oneWeekAgo } 
    });
    
    // Get top drivers by rating
    const topDrivers = await Driver.find({ rating: { $gt: 0 } })
      .sort({ rating: -1 })
      .limit(5)
      .select('firstName lastName rating');
      
    return {
      totalDrivers,
      activeDrivers,
      newDrivers,
      topDrivers
    };
  } catch (error) {
    console.error('Error getting driver stats:', error);
    return {
      totalDrivers: 0,
      activeDrivers: 0,
      newDrivers: 0,
      topDrivers: []
    };
  }
};

/**
 * Get customer statistics
 */
const getCustomerStats = async () => {
  try {
    // Get total customers
    const totalCustomers = await Customer.countDocuments();
    
    // Get active customers
    const activeCustomers = await Customer.countDocuments({ status: 'active' });
    
    // Get new customers this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newCustomers = await Customer.countDocuments({ 
      createdAt: { $gte: oneWeekAgo } 
    });
    
    return {
      totalCustomers,
      activeCustomers,
      newCustomers
    };
  } catch (error) {
    console.error('Error getting customer stats:', error);
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      newCustomers: 0
    };
  }
};

/**
 * Get billing statistics
 */
const getBillingStats = async () => {
  try {
    // Get total revenue
    const totalRevenue = await Bill.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get recent bills
    const recentBills = await Bill.find()
      .sort({ date: -1 })
      .limit(10)
      .populate('customerId', 'firstName lastName')
      .populate('driverId', 'firstName lastName');
      
    // Format bills for frontend
    const billingData = recentBills.map(bill => ({
      id: bill.billId,
      date: bill.date.toISOString().split('T')[0],
      customer: `${bill.customerId.firstName} ${bill.customerId.lastName}`,
      driver: `${bill.driverId.firstName} ${bill.driverId.lastName}`,
      amount: bill.amount,
      source: bill.source,
      destination: bill.destination
    }));
    
    return {
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      billingData
    };
  } catch (error) {
    console.error('Error getting billing stats:', error);
    return {
      totalRevenue: 0,
      billingData: []
    };
  }
};

module.exports = {
  initializeKafkaConsumer,
  getOverviewStats,
  getRideStats,
  getDriverStats,
  getCustomerStats,
  getBillingStats
}; 