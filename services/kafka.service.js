/**
 * Kafka Service
 * 
 * Handles Kafka message processing for real-time updates
 */

const { sendDashboardUpdate } = require('./websocket.service');

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
          console.log(`Received message from topic ${topic}:`, data);
          
          // Process based on topic (simplified for demo)
          sendDashboardUpdate(topic, data);
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
  // Return mock data for now
  return {
    totalRides: 4827,
    totalDrivers: 321,
    totalCustomers: 1253,
    totalRevenue: 78659.45,
    activeDrivers: 298,
    activeCustomers: 876
  };
};

/**
 * Get ride statistics 
 */
const getRideStats = async () => {
  // Return mock data for now
  const ridesByCity = [
    { city: "New York", value: 1245 },
    { city: "Los Angeles", value: 862 },
    { city: "Chicago", value: 573 },
    { city: "Houston", value: 421 },
    { city: "Phoenix", value: 312 },
    { city: "Philadelphia", value: 245 }
  ];
  
  const ridesByHour = Array.from({ length: 24 }, (_, i) => {
    let rides = 15;
    if (i >= 7 && i <= 9) rides = 60 + Math.floor(Math.random() * 30);
    else if (i >= 16 && i <= 19) rides = 85 + Math.floor(Math.random() * 40);
    else if (i >= 11 && i <= 14) rides = 45 + Math.floor(Math.random() * 20);
    else if (i >= 1 && i <= 5) rides = Math.floor(Math.random() * 15);
    return { hour: i, rides };
  });
  
  return {
    ridesByCity,
    ridesByHour
  };
};

/**
 * Get driver statistics
 */
const getDriverStats = async () => {
  // Return mock data for now
  return {
    totalDrivers: 321,
    activeDrivers: 298,
    newDrivers: 24,
    topDrivers: [
      { firstName: 'John', lastName: 'Smith', rating: 4.9 },
      { firstName: 'Mary', lastName: 'Johnson', rating: 4.8 },
      { firstName: 'David', lastName: 'Williams', rating: 4.8 },
      { firstName: 'Sarah', lastName: 'Brown', rating: 4.7 },
      { firstName: 'Michael', lastName: 'Jones', rating: 4.7 }
    ]
  };
};

/**
 * Get customer statistics
 */
const getCustomerStats = async () => {
  // Return mock data for now
  return {
    totalCustomers: 1253,
    activeCustomers: 876,
    newCustomers: 42
  };
};

/**
 * Get billing statistics
 */
const getBillingStats = async () => {
  // Return mock data for now
  return {
    totalRevenue: 78659.45,
    billingData: [
      { id: 'B123456', date: '2023-05-10', amount: 35.75, customer: 'John Doe', driver: 'Mark Wilson', source: 'Downtown', destination: 'Airport' },
      { id: 'B123457', date: '2023-05-10', amount: 22.50, customer: 'Jane Smith', driver: 'Sarah Johnson', source: 'Mall', destination: 'Residential Area' },
      { id: 'B123458', date: '2023-05-11', amount: 45.20, customer: 'Robert Brown', driver: 'James Davis', source: 'Office Park', destination: 'Suburbs' },
      { id: 'B123459', date: '2023-05-11', amount: 18.30, customer: 'Emily Wilson', driver: 'Tom Garcia', source: 'University', destination: 'Downtown' },
      { id: 'B123460', date: '2023-05-12', amount: 28.90, customer: 'Michael Lee', driver: 'David Clark', source: 'Hotel', destination: 'Restaurant District' }
    ]
  };
};

module.exports = {
  initializeKafkaConsumer,
  getOverviewStats,
  getRideStats,
  getDriverStats,
  getCustomerStats,
  getBillingStats
}; 