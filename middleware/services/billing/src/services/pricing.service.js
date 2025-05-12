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
  const rideLevelMultiplier = 1.4; // Extreme ride level multiplier (40% increase)
  const maxPrice = Math.max(
    MIN_FARE,
    ((BASE_FARE + (distance * COST_PER_MILE) + (estimateTravelTime(distance, 'afternoon') * COST_PER_MINUTE)) * maxSurge + BOOKING_FEE) * rideLevelMultiplier
  );
  return Math.min(Math.max(fare, MIN_FARE), maxPrice);
};

/**
 * Hard-coded fare calculator using distance, duration, and getSurgeMultiplier
 * @param {Object} params - {distance, duration, rideLevel}
 * @returns {Promise<{fare: number, breakdown: object}>}
 */
const hardCodedFareCalculator = async ({distance, duration, rideLevel}) => {
  const actualDistance = distance || 0;
  const rideDuration = duration || 0;

  // Use getSurgeMultiplier to calculate surge multiplier
  const surgeMultiplier = await getSurgeMultiplier({
    latitude: 0, // Replace with actual latitude if available
    longitude: 0 // Replace with actual longitude if available
  }, new Date());

  const baseFare = BASE_FARE;
  const timeAmount = rideDuration * COST_PER_MINUTE;
  const distanceAmount = actualDistance * COST_PER_MILE;
  let subtotal = baseFare + timeAmount + distanceAmount;
  subtotal *= surgeMultiplier; // Apply surge multiplier

  // Adjust subtotal based on ride level (e.g., premium rides may have higher costs)
  if (rideLevel !== undefined) {
    const rideLevelMultiplier = 1 + (rideLevel * 0.1); // Example: 10% increase per level
    subtotal *= rideLevelMultiplier;
  }

  const total = subtotal + BOOKING_FEE;
  const finalFare = boundFare(Math.max(total, MIN_FARE), actualDistance);

  // Calculate taxes (assume 8% tax rate)
  const taxRate = 0.08;
  const taxes = finalFare * taxRate;

  // Calculate driver payout (80% of fare excluding booking fee and taxes)
  const fareBeforeFees = subtotal;
  const driverPayout = fareBeforeFees * 0.8;

  // Calculate platform fee (20% of fare excluding booking fee and taxes)
  const platformFee = fareBeforeFees * 0.2;

  return {
    fare: finalFare,
    breakdown: {
      timeAmount,
      distanceAmount,
      bookingFee: BOOKING_FEE,
      actualDistance,
      actualTime: rideDuration,
      taxes,
      driverPayout,
      platformFee,
      fallback: true
    }
  };
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
    const rideDuration = estimateTravelTime(distance, 'afternoon');
    const timeAmount = rideDuration * COST_PER_MINUTE;
    const distanceAmount = distance * COST_PER_MILE;
    const subtotal = BASE_FARE + timeAmount + distanceAmount;
    const finalFare = boundFare(predictedFare, distance);
    return {
      fare: finalFare,
      breakdown: {
        timeAmount,
        distanceAmount,
        bookingFee: BOOKING_FEE,
        predictedDistance: distance,
        predictedTime: rideDuration,
        taxes: finalFare * 0.08,
        driverPayout: subtotal * 0.8,
        platformFee: subtotal * 0.2,
        modelPredictionUsed: true
      }
    };
  } catch (error) {
    // Check if the error is a connection refused error
    if (error.code === 'ECONNREFUSED') {
      const defaultModelServiceUrl = process.env.MODEL_PREDICTION_URL || 'http://localhost:8050/predict';
      // Attempt to get the actual URL from the error object if available (Axios specific)
      const attemptedUrl = (error.config && error.config.url) ? error.config.url : defaultModelServiceUrl;
      console.warn(`Model prediction service at ${attemptedUrl} was unavailable (ECONNREFUSED). Using fallback calculation.`);
    } else {
      // For any other errors, log them as before
      console.error('Error calculating predicted fare via model-prediction:', error);
    }
    
    // Fallback: use hardCodedFareCalculator
    return await hardCodedFareCalculator({
      pickup,
      dropoff,
      pickupTime: requestTime
    });
  }
};

const calculateActualFare = async (rideData) => {
  try {
    // Extract ride details
    const { 
      pickupLocation, 
      dropoffLocation, 
      pickupTimestamp, 
      distance, 
      rideLevel // Added rideLevel parameter
    } = rideData;

    // Convert pickupTimestamp to a Date object if it's not already
    const pickupTime = pickupTimestamp instanceof Date ? pickupTimestamp : new Date(pickupTimestamp);

    // Use the current time as the dropoff time
    const dropoffTime = new Date();

    // Calculate actual ride duration in minutes
    const rideDuration = (dropoffTime - pickupTime) / (1000 * 60);

    // Calculate actual distance
    const actualDistance = distance || calculateDistance(pickupLocation, dropoffLocation);

    // Prepare features for model-prediction service
    const pickup_hour = pickupTime.getHours();
    const pickup_weekday = pickupTime.getDay();
    const passenger_count = 1;
    const features = {
      pickup_latitude: pickupLocation.latitude,
      pickup_longitude: pickupLocation.longitude,
      dropoff_latitude: dropoffLocation.latitude,
      dropoff_longitude: dropoffLocation.longitude,
      pickup_hour,
      pickup_weekday,
      passenger_count,
      distance: actualDistance,
      duration: rideDuration
    };

    let fareFromModel = null;
    try {
      fareFromModel = await callModelPredictionService(features);
    } catch (err) {
      // If model fails, fallback will be used below
    }

    let finalFare, baseFare, timeAmount, distanceAmount, subtotal, surgeMultiplier, breakdown;
    if (fareFromModel !== null && !isNaN(fareFromModel)) {
      // Use model fare, but still calculate breakdown for reporting
      baseFare = BASE_FARE;
      timeAmount = rideDuration * COST_PER_MINUTE;
      distanceAmount = actualDistance * COST_PER_MILE;
      subtotal = baseFare + timeAmount + distanceAmount;
      finalFare = boundFare(fareFromModel, actualDistance);
      breakdown = {
        timeAmount: timeAmount,
        distanceAmount: distanceAmount,
        bookingFee: BOOKING_FEE,
        actualDistance: actualDistance,
        actualTime: rideDuration,
        taxes: finalFare * 0.08,
        driverPayout: subtotal * 0.8,
        platformFee: subtotal * 0.2,
        modelPredictionUsed: true
      };
    } else {
      // Fallback: use hardCodedFareCalculator
      return await hardCodedFareCalculator({
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        pickupTime,
        distance: actualDistance,
        duration: rideDuration,
        rideLevel // Pass rideLevel to hardCodedFareCalculator
      });
    }
    return {
      fare: finalFare,
      breakdown
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