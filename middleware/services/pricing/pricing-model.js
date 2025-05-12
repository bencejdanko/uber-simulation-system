/**
 * Dynamic Pricing Algorithm for Uber Simulation
 * 
 * This module implements a dynamic pricing algorithm using machine learning techniques
 * based on the Kaggle dataset referenced in the project requirements.
 * 
 * The algorithm considers:
 * - Base fare calculation
 * - Historical data & demand
 * - Machine learning predictions
 */

const { LinearRegression } = require('ml-regression');
const tf = require('@tensorflow/tfjs-node');
const Redis = require('ioredis');
const moment = require('moment');

// Redis client for caching predictions and demand data
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

// Constants for pricing model
const BASE_FARE = 2.5;         // Base fare in USD
const PER_MILE_RATE = 1.5;     // Per mile rate in USD
const PER_MINUTE_RATE = 0.2;   // Per minute rate in USD
const MINIMUM_FARE = 5.0;      // Minimum fare in USD
const CANCEL_FEE = 5.0;        // Cancellation fee in USD

// Surge pricing thresholds
const SURGE_THRESHOLDS = {
  low: { threshold: 0.5, multiplier: 1.0 },
  medium: { threshold: 0.7, multiplier: 1.2 },
  high: { threshold: 0.85, multiplier: 1.5 },
  veryHigh: { threshold: 0.95, multiplier: 2.0 }
};

// Time factors
const TIME_FACTORS = {
  WEEKDAY_MORNING_RUSH: { startHour: 7, endHour: 9, factor: 1.3 },
  WEEKDAY_EVENING_RUSH: { startHour: 17, endHour: 19, factor: 1.5 },
  WEEKEND_NIGHT: { startHour: 22, endHour: 2, factor: 1.4 }
};

// Weather factors
const WEATHER_FACTORS = {
  RAIN: 1.2,
  SNOW: 1.5,
  CLEAR: 1.0
};

// Event factors
const EVENT_FACTOR = 1.3;

// Class to handle machine learning model for fare prediction
class FarePredictionModel {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.linearModel = null;
  }

  // Initialize the model
  async initialize() {
    try {
      // Load TensorFlow model
      this.model = await tf.loadLayersModel('file://./models/fare_prediction_model/model.json');
      
      // Load Linear Regression model for simpler predictions
      // This is a fallback if the TensorFlow model fails
      const loadLinearModel = require('./linearRegressionLoader');
      this.linearModel = await loadLinearModel();
      
      this.isLoaded = true;
      console.log('Fare prediction models loaded successfully');
    } catch (error) {
      console.error('Error loading ML model:', error);
      // Create a simple linear regression model as fallback
      this.createFallbackModel();
    }
  }

  // Create a fallback linear regression model based on sampled data points
  createFallbackModel() {
    // Sample data from the Kaggle dataset (simplified)
    const distances = [
      2.5, 5.0, 3.2, 7.8, 10.5, 1.2, 4.7, 6.3, 8.9, 12.0,
      3.7, 5.5, 9.1, 2.8, 6.7, 4.3, 11.2, 7.3, 3.9, 5.8
    ];
    
    const durations = [
      10, 18, 12, 25, 35, 5, 15, 22, 30, 40,
      14, 20, 32, 11, 24, 16, 38, 26, 15, 21
    ];
    
    const fares = [
      10.5, 20.2, 13.8, 30.5, 42.7, 6.8, 19.3, 25.8, 37.2, 50.5,
      16.2, 22.8, 38.5, 12.3, 28.7, 18.5, 45.8, 29.7, 17.2, 23.6
    ];
    
    // Create features array (distance and duration)
    const features = distances.map((distance, i) => [distance, durations[i]]);
    
    // Train linear regression model
    this.linearModel = new LinearRegression(features, fares);
    console.log('Fallback linear regression model created');
  }

  // Predict fare using either the TensorFlow model or fallback linear model
  predictFare(distance, duration, pickupTime, dropoffTime, passengerCount, 
              pickupLat, pickupLong, dropoffLat, dropoffLong) {
    try {
      if (this.model && this.isLoaded) {
        // Preprocessing for TensorFlow model
        const input = tf.tensor2d([[
          distance,
          duration,
          passengerCount,
          pickupLat,
          pickupLong,
          dropoffLat,
          dropoffLong,
          new Date(pickupTime).getHours(),
          new Date(pickupTime).getDay()
        ]]);
        
        // Make prediction
        const prediction = this.model.predict(input);
        const fare = prediction.dataSync()[0];
        return fare;
      } else if (this.linearModel) {
        // Use linear regression model as fallback
        return this.linearModel.predict([distance, duration]);
      } else {
        // If both models fail, use simple formula
        return this.fallbackFormula(distance, duration);
      }
    } catch (error) {
      console.error('Error predicting fare:', error);
      return this.fallbackFormula(distance, duration);
    }
  }

  // Simple fallback formula if all ML models fail
  fallbackFormula(distance, duration) {
    return BASE_FARE + (PER_MILE_RATE * distance) + (PER_MINUTE_RATE * duration);
  }
}

// Class to handle demand-based dynamic pricing
class DemandBasedPricing {
  constructor() {
    this.redis = redis;
    this.cacheExpiry = 300; // 5 minutes
  }

  // Get current demand for a specific area (city or region)
  async getCurrentDemand(area, radius) {
    const cacheKey = `demand:${area}:${radius}`;
    
    try {
      // Try to get cached value first
      const cachedDemand = await this.redis.get(cacheKey);
      if (cachedDemand) {
        return JSON.parse(cachedDemand);
      }
      
      // If not cached, fetch from database (simulated here)
      const demand = await this.fetchDemandFromDB(area, radius);
      
      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(demand), 'EX', this.cacheExpiry);
      
      return demand;
    } catch (error) {
      console.error('Error getting current demand:', error);
      // Return default demand data
      return { ratio: 0.6, activeDrivers: 15, pendingRequests: 9 };
    }
  }

  // Simulate fetching demand data from database
  async fetchDemandFromDB(area, radius) {
    // In a real application, this would query a database for:
    // 1. Number of active drivers in the area
    // 2. Number of pending ride requests
    // 3. Historical demand for current time
    
    // For simulation, generate somewhat realistic numbers
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const isWeekend = day === 0 || day === 6;
    
    // Simulate rush hour demand
    let demandFactor = 0.6; // Default demand
    
    if (isWeekend) {
      if (hour >= 21 || hour < 3) {
        demandFactor = 0.85; // Weekend nights
      } else {
        demandFactor = 0.7; // Regular weekend
      }
    } else {
      if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        demandFactor = 0.9; // Weekday rush hours
      } else if (hour >= 11 && hour <= 13) {
        demandFactor = 0.75; // Lunch time
      }
    }
    
    // Add some randomness
    demandFactor += (Math.random() * 0.2 - 0.1);
    demandFactor = Math.min(Math.max(demandFactor, 0.2), 1.0);
    
    // Simulate number of drivers and requests
    const activeDrivers = Math.floor(20 + Math.random() * 30);
    const pendingRequests = Math.floor(activeDrivers * demandFactor);
    
    return {
      ratio: demandFactor,
      activeDrivers,
      pendingRequests
    };
  }

  // Calculate surge multiplier based on demand
  getSurgeMultiplier(demandRatio) {
    if (demandRatio >= SURGE_THRESHOLDS.veryHigh.threshold) {
      return SURGE_THRESHOLDS.veryHigh.multiplier;
    } else if (demandRatio >= SURGE_THRESHOLDS.high.threshold) {
      return SURGE_THRESHOLDS.high.multiplier;
    } else if (demandRatio >= SURGE_THRESHOLDS.medium.threshold) {
      return SURGE_THRESHOLDS.medium.multiplier;
    } else {
      return SURGE_THRESHOLDS.low.multiplier;
    }
  }
}

// Main class that provides dynamic pricing API
class DynamicPricingService {
  constructor() {
    this.farePredictionModel = new FarePredictionModel();
    this.demandPricing = new DemandBasedPricing();
    this.initialize();
  }

  async initialize() {
    await this.farePredictionModel.initialize();
  }

  // Calculate price for a ride
  async calculatePrice(rideDetails) {
    const {
      pickupLocation,
      dropoffLocation,
      distance,
      estimatedDuration,
      pickupTime,
      passengerCount,
      weatherCondition,
      specialEvent
    } = rideDetails;
    
    try {
      // Step 1: Get base fare using ML model prediction
      const baseFare = this.farePredictionModel.predictFare(
        distance,
        estimatedDuration,
        pickupTime,
        moment(pickupTime).add(estimatedDuration, 'minutes').toDate(),
        passengerCount,
        pickupLocation.latitude,
        pickupLocation.longitude,
        dropoffLocation.latitude,
        dropoffLocation.longitude
      );
      
      // Step 2: Get current demand and surge multiplier
      const area = pickupLocation.city;
      const demand = await this.demandPricing.getCurrentDemand(area, 5); // 5 mile radius
      const surgeMultiplier = this.demandPricing.getSurgeMultiplier(demand.ratio);
      
      // Step 3: Apply time-based factors
      const timeMultiplier = this.getTimeMultiplier(pickupTime);
      
      // Step 4: Apply weather factor if available
      const weatherMultiplier = weatherCondition ? 
        WEATHER_FACTORS[weatherCondition.toUpperCase()] || 1.0 : 1.0;
      
      // Step 5: Apply special event factor if applicable
      const eventMultiplier = specialEvent ? EVENT_FACTOR : 1.0;
      
      // Calculate final price with all factors
      let finalPrice = baseFare * surgeMultiplier * timeMultiplier * weatherMultiplier * eventMultiplier;
      
      // Ensure minimum fare
      finalPrice = Math.max(finalPrice, MINIMUM_FARE);
      
      // Round to 2 decimal places
      finalPrice = Math.round(finalPrice * 100) / 100;
      
      // Prepare response with pricing breakdown
      return {
        baseFare: parseFloat(baseFare.toFixed(2)),
        distance,
        estimatedDuration,
        surgeMultiplier: parseFloat(surgeMultiplier.toFixed(2)),
        demand: {
          ratio: parseFloat(demand.ratio.toFixed(2)),
          activeDrivers: demand.activeDrivers,
          pendingRequests: demand.pendingRequests
        },
        timeMultiplier: parseFloat(timeMultiplier.toFixed(2)),
        weatherMultiplier: parseFloat(weatherMultiplier.toFixed(2)),
        eventMultiplier: parseFloat(eventMultiplier.toFixed(2)),
        finalPrice
      };
    } catch (error) {
      console.error('Error calculating dynamic price:', error);
      
      // Fallback pricing if something fails
      const fallbackPrice = BASE_FARE + (PER_MILE_RATE * distance) + (PER_MINUTE_RATE * estimatedDuration);
      
      return {
        baseFare: BASE_FARE,
        distanceFare: parseFloat((PER_MILE_RATE * distance).toFixed(2)),
        durationFare: parseFloat((PER_MINUTE_RATE * estimatedDuration).toFixed(2)),
        finalPrice: parseFloat(fallbackPrice.toFixed(2)),
        isEstimate: true,
        note: 'Fallback pricing used due to calculation error'
      };
    }
  }

  // Get time-based multiplier based on time of day
  getTimeMultiplier(pickupTime) {
    const time = new Date(pickupTime);
    const hour = time.getHours();
    const day = time.getDay();
    const isWeekday = day >= 1 && day <= 5;
    
    // Check if time falls within rush hour periods
    if (isWeekday) {
      const morningRush = TIME_FACTORS.WEEKDAY_MORNING_RUSH;
      if (hour >= morningRush.startHour && hour <= morningRush.endHour) {
        return morningRush.factor;
      }
      
      const eveningRush = TIME_FACTORS.WEEKDAY_EVENING_RUSH;
      if (hour >= eveningRush.startHour && hour <= eveningRush.endHour) {
        return eveningRush.factor;
      }
    } else {
      const weekendNight = TIME_FACTORS.WEEKEND_NIGHT;
      if (hour >= weekendNight.startHour || hour <= weekendNight.endHour) {
        return weekendNight.factor;
      }
    }
    
    return 1.0; // Default multiplier for non-peak times
  }
}

module.exports = new DynamicPricingService(); 