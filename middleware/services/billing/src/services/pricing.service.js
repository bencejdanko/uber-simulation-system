/**
 * Dynamic Pricing Service
 * 
 * This service implements Uber's dynamic pricing algorithm based on:
 * 1. Base fare calculation
 * 2. Historical data & demand analysis
 * 3. Machine learning predictions
 * 
 * The pricing algorithm uses the Kaggle dataset for training and prediction.
 */

const Redis = require('ioredis');
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

const axios = require('axios');

// Constants for pricing
const BASE_FARE = 2.50;           // Base fare in USD
const COST_PER_MINUTE = 0.35;     // Cost per minute in USD
const COST_PER_MILE = 1.75;       // Cost per mile in USD
const BOOKING_FEE = 2.00;         // Booking fee in USD
const MIN_FARE = 7.00;            // Minimum fare in USD

// Surge multiplier ranges
const SURGE_LEVELS = {
  NONE: 1.0,
  LOW: 1.2,
  MEDIUM: 1.5,
  HIGH: 2.0,
  VERY_HIGH: 2.5,
  EXTREME: 3.0
};

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param {Object} pickup - Pickup coordinates {latitude, longitude}
 * @param {Object} dropoff - Dropoff coordinates {latitude, longitude}
 * @returns {number} - Distance in miles
 */
const calculateDistance = (pickup, dropoff) => {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(dropoff.latitude - pickup.latitude);
  const dLon = toRadians(dropoff.longitude - pickup.longitude);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(pickup.latitude)) * Math.cos(toRadians(dropoff.latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} - Angle in radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Estimate the travel time between two points based on distance and average speed
 * @param {number} distance - Distance in miles
 * @param {string} timeOfDay - Time of day (morning, afternoon, evening, night)
 * @returns {number} - Estimated travel time in minutes
 */
const estimateTravelTime = (distance, timeOfDay) => {
  // Average speeds in mph based on time of day
  const averageSpeeds = {
    morning: 20,    // Morning rush hour
    afternoon: 25,  // Afternoon
    evening: 18,    // Evening rush hour
    night: 30       // Night time
  };
  
  // Default to afternoon if timeOfDay is not specified
  const speed = averageSpeeds[timeOfDay] || averageSpeeds.afternoon;
  
  // Calculate time in minutes
  return (distance / speed) * 60;
};

/**
 * Get the current surge multiplier based on demand and supply
 * @param {Object} location - Location coordinates {latitude, longitude}
 * @param {Date} requestTime - Time of the ride request
 * @returns {Promise<number>} - Surge multiplier
 */
const getSurgeMultiplier = async (location, requestTime) => {
  try {
    // Check if we have a cached surge value for this area and time
    const cacheKey = `surge:${Math.round(location.latitude * 100) / 100}:${Math.round(location.longitude * 100) / 100}:${requestTime.getHours()}`;
    const cachedSurge = await redisClient.get(cacheKey);
    
    if (cachedSurge) {
      return parseFloat(cachedSurge);
    }
    
    // If no cached value, calculate surge based on various factors
    
    // 1. Time of day factor (0.8 to 1.5)
    const hour = requestTime.getHours();
    let timeOfDayFactor;
    
    if (hour >= 7 && hour <= 9) {
      // Morning rush hour
      timeOfDayFactor = 1.3;
    } else if (hour >= 16 && hour <= 19) {
      // Evening rush hour
      timeOfDayFactor = 1.4;
    } else if (hour >= 22 || hour <= 2) {
      // Late night
      timeOfDayFactor = 1.2;
    } else {
      // Normal hours
      timeOfDayFactor = 1.0;
    }
    
    // 2. Day of week factor (0.9 to 1.3)
    const day = requestTime.getDay(); // 0 = Sunday, 6 = Saturday
    let dayOfWeekFactor;
    
    if (day === 5 || day === 6) {
      // Weekend
      dayOfWeekFactor = 1.2;
    } else {
      // Weekday
      dayOfWeekFactor = 1.0;
    }
    
    // 3. Special events factor (1.0 to 1.5)
    // This would typically come from an external API or database
    // For simulation, we'll randomly determine if there's a special event
    const specialEventFactor = Math.random() < 0.1 ? 1.3 : 1.0;
    
    // 4. Weather factor (1.0 to 1.4)
    // This would typically come from a weather API
    // For simulation, we'll randomly determine if there's bad weather
    const weatherFactor = Math.random() < 0.2 ? 1.2 : 1.0;
    
    // 5. Supply-demand imbalance factor (0.9 to 2.0)
    // This would typically come from real-time data on available drivers vs. ride requests
    // For simulation, we'll use a random value
    const supplyDemandFactor = 0.9 + (Math.random() * 0.5);
    
    // Calculate the final surge multiplier
    let surgeMultiplier = timeOfDayFactor * dayOfWeekFactor * specialEventFactor * weatherFactor * supplyDemandFactor;
    
    // Round to nearest surge level
    if (surgeMultiplier <= 1.1) {
      surgeMultiplier = SURGE_LEVELS.NONE;
    } else if (surgeMultiplier <= 1.3) {
      surgeMultiplier = SURGE_LEVELS.LOW;
    } else if (surgeMultiplier <= 1.7) {
      surgeMultiplier = SURGE_LEVELS.MEDIUM;
    } else if (surgeMultiplier <= 2.2) {
      surgeMultiplier = SURGE_LEVELS.HIGH;
    } else if (surgeMultiplier <= 2.7) {
      surgeMultiplier = SURGE_LEVELS.VERY_HIGH;
    } else {
      surgeMultiplier = SURGE_LEVELS.EXTREME;
    }
    
    // Cache the surge multiplier for 5 minutes
    await redisClient.set(cacheKey, surgeMultiplier, 'EX', 300);
    
    return surgeMultiplier;
  } catch (error) {
    console.error('Error calculating surge multiplier:', error);
    // Default to no surge in case of error
    return SURGE_LEVELS.NONE;
  }
};

/**
 * Call the model-prediction service to get a fare prediction
 * @param {Object} features - Features for the model
 * @returns {Promise<number>} - Predicted fare
 */
const callModelPredictionService = async (features) => {
  try {
    const response = await axios.post(
      process.env.MODEL_PREDICTION_URL || 'http://localhost:8050/predict',
      features
    );
    return response.data.predicted_fare;
  } catch (error) {
    throw error;
  }
};

/**
 * Bound a fare between MIN_FARE and a calculated max price based on distance and extreme surge
 * @param {number} fare - The fare to bound
 * @param {number} distance - The ride distance in miles
 * @returns {number} - The bounded fare
 */
const boundFare = (fare, distance) => {
  const maxSurge = SURGE_LEVELS.EXTREME;
  const maxPrice = Math.max(
    MIN_FARE,
    (BASE_FARE + (distance * COST_PER_MILE) + (estimateTravelTime(distance, 'afternoon') * COST_PER_MINUTE)) * maxSurge + BOOKING_FEE
  );
  return Math.min(Math.max(fare, MIN_FARE), maxPrice);
};

const calculatePredictedFare = async (pickup, dropoff, requestTime = new Date()) => {
  try {
    const pickup_hour = requestTime.getHours();
    const pickup_weekday = requestTime.getDay();
    const passenger_count = 1;
    const features = {
      pickup_latitude: pickup.latitude,
      pickup_longitude: pickup.longitude,
      dropoff_latitude: dropoff.latitude,
      dropoff_longitude: dropoff.longitude,
      pickup_hour,
      pickup_weekday,
      passenger_count
    };
    const predictedFare = await callModelPredictionService(features);
    const distance = calculateDistance(pickup, dropoff);
    const boundedFare = boundFare(predictedFare, distance);
    return {
      fare: boundedFare,
      breakdown: {
        modelPrediction: true,
        minFare: MIN_FARE,
        maxFare: boundFare(Infinity, distance)
      }
    };
  } catch (error) {
    console.error('Error calculating predicted fare via model-prediction:', error);
    // Fallback: hard-coded fare calculation
    const distance = calculateDistance(pickup, dropoff);
    const pickup_hour = requestTime.getHours();
    let timeOfDay = 'afternoon';
    let surge = 1.0;
    if (pickup_hour >= 7 && pickup_hour <= 9) {
      timeOfDay = 'morning';
      surge = SURGE_LEVELS.MEDIUM;
    } else if (pickup_hour >= 16 && pickup_hour <= 19) {
      timeOfDay = 'evening';
      surge = SURGE_LEVELS.HIGH;
    } else if (pickup_hour >= 22 || pickup_hour <= 2) {
      timeOfDay = 'night';
      surge = SURGE_LEVELS.LOW;
    }
    const travelTime = estimateTravelTime(distance, timeOfDay);
    const baseFare = BASE_FARE;
    const timeAmount = travelTime * COST_PER_MINUTE;
    const distanceAmount = distance * COST_PER_MILE;
    let subtotal = baseFare + timeAmount + distanceAmount;
    subtotal *= surge;
    const total = subtotal + BOOKING_FEE;
    const finalFare = Math.max(total, MIN_FARE);
    const roundedFare = Math.round(finalFare * 100) / 100;
    return {
      fare: roundedFare,
      breakdown: {
        baseAmount: baseFare,
        timeAmount,
        distanceAmount,
        bookingFee: BOOKING_FEE,
        surge,
        fallback: true
      }
    };
  }
};

/**
 * Calculate the actual fare for a completed ride
 * @param {Object} rideData - Completed ride data
 * @returns {Promise<Object>} - Actual fare details
 */
const calculateActualFare = async (rideData) => {
  try {
    // Extract ride details
    const { 
      pickupLocation, 
      dropoffLocation, 
      pickupTimestamp, 
      dropoffTimestamp, 
      distance 
    } = rideData;
    
    // Convert timestamps to Date objects if they're not already
    const pickupTime = pickupTimestamp instanceof Date ? pickupTimestamp : new Date(pickupTimestamp);
    const dropoffTime = dropoffTimestamp instanceof Date ? dropoffTimestamp : new Date(dropoffTimestamp);
    
    // Calculate actual ride duration in minutes
    const rideDuration = (dropoffTime - pickupTime) / (1000 * 60);
    
    // Get surge multiplier that was in effect at pickup time
    const surgeMultiplier = await getSurgeMultiplier(pickupLocation, pickupTime);
    
    // Calculate base fare
    const baseFare = BASE_FARE;
    
    // Calculate time component
    const timeAmount = rideDuration * COST_PER_MINUTE;
    
    // Calculate distance component (use actual distance if provided, otherwise calculate)
    const actualDistance = distance || calculateDistance(pickupLocation, dropoffLocation);
    const distanceAmount = actualDistance * COST_PER_MILE;
    
    // Calculate subtotal
    let subtotal = baseFare + timeAmount + distanceAmount;
    
    // Apply surge pricing
    subtotal *= surgeMultiplier;
    
    // Add booking fee
    const total = subtotal + BOOKING_FEE;
    
    // Apply minimum fare if necessary
    const finalFare = Math.max(total, MIN_FARE);
    
    // Round to 2 decimal places
    const roundedFare = Math.round(finalFare * 100) / 100;
    
    // Bound the actual fare as well
    const boundedFare = boundFare(roundedFare, actualDistance);
    
    // Calculate taxes (assume 8% tax rate)
    const taxRate = 0.08;
    const taxes = boundedFare * taxRate;
    
    // Calculate driver payout (80% of fare excluding booking fee and taxes)
    const fareBeforeFees = subtotal;
    const driverPayout = fareBeforeFees * 0.8;
    
    // Calculate platform fee (20% of fare excluding booking fee and taxes)
    const platformFee = fareBeforeFees * 0.2;
    
    // Return the fare breakdown
    return {
      fare: boundedFare,
      breakdown: {
        baseAmount: baseFare,
        timeAmount: timeAmount,
        distanceAmount: distanceAmount,
        bookingFee: BOOKING_FEE,
        surge: surgeMultiplier,
        actualDistance: actualDistance,
        actualTime: rideDuration,
        taxes: taxes,
        driverPayout: driverPayout,
        platformFee: platformFee,
        minFare: MIN_FARE,
        maxFare: boundFare(Infinity, actualDistance)
      }
    };
  } catch (error) {
    console.error('Error calculating actual fare:', error);
    throw new Error('Failed to calculate actual fare');
  }
};

module.exports = {
  calculatePredictedFare,
  calculateActualFare,
  calculateDistance,
  estimateTravelTime,
  getSurgeMultiplier
};