const pricingService = require('../services/pricing.service');

/**
 * Calculate predicted fare
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const calculatePredictedFare = async (req, res) => {
  try {
    const { pickup, dropoff, requestTime } = req.body;
    
    // Validate request body
    if (!pickup || !dropoff) {
      return res.status(400).json({
        error: 'missing_required_field',
        message: 'Pickup and dropoff locations are required'
      });
    }
    
    // Validate location coordinates
    if (!pickup.latitude || !pickup.longitude || 
        !dropoff.latitude || !dropoff.longitude) {
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Pickup and dropoff locations must include latitude and longitude'
      });
    }
    
    // Validate latitude and longitude ranges
    if (pickup.latitude < -90 || pickup.latitude > 90 || 
        pickup.longitude < -180 || pickup.longitude > 180 ||
        dropoff.latitude < -90 || dropoff.latitude > 90 || 
        dropoff.longitude < -180 || dropoff.longitude > 180) {
      return res.status(400).json({
        error: 'invalid_coordinates',
        message: 'Latitude must be between -90 and 90, longitude must be between -180 and 180'
      });
    }
    
    // Parse request time if provided
    let parsedRequestTime = requestTime ? new Date(requestTime) : new Date();
    
    // Validate request time if provided
    if (requestTime && isNaN(parsedRequestTime.getTime())) {
      return res.status(400).json({
        error: 'invalid_date_format',
        message: 'Invalid request time format. Must be a valid ISO 8601 date string'
      });
    }
    
    // Calculate predicted fare
    const fareDetails = await pricingService.calculatePredictedFare(
      pickup,
      dropoff,
      parsedRequestTime
    );
    
    // Return the fare details
    res.status(200).json(fareDetails);
  } catch (error) {
    console.error('Error in calculatePredictedFare controller:', error);
    
    res.status(500).json({
      error: 'server_error',
      message: 'An error occurred while calculating the predicted fare'
    });
  }
};

/**
 * Calculate actual fare
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const calculateActualFare = async (req, res) => {
  try {
    const { 
      pickupLocation, 
      dropoffLocation, 
      pickupTimestamp, 
      dropoffTimestamp, 
      distance 
    } = req.body;
    
    // Validate request body
    if (!pickupLocation || !dropoffLocation || !pickupTimestamp || !dropoffTimestamp) {
      return res.status(400).json({
        error: 'missing_required_field',
        message: 'Pickup location, dropoff location, pickup timestamp, and dropoff timestamp are required'
      });
    }
    
    // Validate location coordinates
    if (!pickupLocation.latitude || !pickupLocation.longitude || 
        !dropoffLocation.latitude || !dropoffLocation.longitude) {
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Pickup and dropoff locations must include latitude and longitude'
      });
    }
    
    // Validate latitude and longitude ranges
    if (pickupLocation.latitude < -90 || pickupLocation.latitude > 90 || 
        pickupLocation.longitude < -180 || pickupLocation.longitude > 180 ||
        dropoffLocation.latitude < -90 || dropoffLocation.latitude > 90 || 
        dropoffLocation.longitude < -180 || dropoffLocation.longitude > 180) {
      return res.status(400).json({
        error: 'invalid_coordinates',
        message: 'Latitude must be between -90 and 90, longitude must be between -180 and 180'
      });
    }
    
    // Validate timestamps
    const pickupTime = new Date(pickupTimestamp);
    const dropoffTime = new Date(dropoffTimestamp);
    
    if (isNaN(pickupTime.getTime()) || isNaN(dropoffTime.getTime())) {
      return res.status(400).json({
        error: 'invalid_date_format',
        message: 'Invalid timestamp format. Must be a valid ISO 8601 date string'
      });
    }
    
    // Validate that pickup time is before dropoff time
    if (pickupTime >= dropoffTime) {
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Pickup time must be before dropoff time'
      });
    }
    
    // Validate distance if provided
    if (distance !== undefined && (isNaN(distance) || distance < 0)) {
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Distance must be a non-negative number'
      });
    }
    
    // Calculate actual fare
    const fareDetails = await pricingService.calculateActualFare({
      pickupLocation,
      dropoffLocation,
      pickupTimestamp,
      dropoffTimestamp,
      distance
    });
    
    // Return the fare details
    res.status(200).json(fareDetails);
  } catch (error) {
    console.error('Error in calculateActualFare controller:', error);
    
    res.status(500).json({
      error: 'server_error',
      message: 'An error occurred while calculating the actual fare'
    });
  }
};

/**
 * Get surge multiplier for a location
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSurgeMultiplier = async (req, res) => {
  try {
    const { latitude, longitude, timestamp } = req.query;
    
    // Validate query parameters
    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'missing_required_field',
        message: 'Latitude and longitude are required'
      });
    }
    
    // Parse latitude and longitude
    const parsedLatitude = parseFloat(latitude);
    const parsedLongitude = parseFloat(longitude);
    
    // Validate latitude and longitude
    if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Latitude and longitude must be numbers'
      });
    }
    
    // Validate latitude and longitude ranges
    if (parsedLatitude < -90 || parsedLatitude > 90 || 
        parsedLongitude < -180 || parsedLongitude > 180) {
      return res.status(400).json({
        error: 'invalid_coordinates',
        message: 'Latitude must be between -90 and 90, longitude must be between -180 and 180'
      });
    }
    
    // Parse timestamp if provided
    let parsedTimestamp = timestamp ? new Date(timestamp) : new Date();
    
    // Validate timestamp if provided
    if (timestamp && isNaN(parsedTimestamp.getTime())) {
      return res.status(400).json({
        error: 'invalid_date_format',
        message: 'Invalid timestamp format. Must be a valid ISO 8601 date string'
      });
    }
    
    // Get surge multiplier
    const surgeMultiplier = await pricingService.getSurgeMultiplier(
      { latitude: parsedLatitude, longitude: parsedLongitude },
      parsedTimestamp
    );
    
    // Return the surge multiplier
    res.status(200).json({ surgeMultiplier });
  } catch (error) {
    console.error('Error in getSurgeMultiplier controller:', error);
    
    res.status(500).json({
      error: 'server_error',
      message: 'An error occurred while getting the surge multiplier'
    });
  }
};

/**
 * Calculate distance between two points
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const calculateDistance = (req, res) => {
  try {
    const { pickup, dropoff } = req.body;
    
    // Validate request body
    if (!pickup || !dropoff) {
      return res.status(400).json({
        error: 'missing_required_field',
        message: 'Pickup and dropoff locations are required'
      });
    }
    
    // Validate location coordinates
    if (!pickup.latitude || !pickup.longitude || 
        !dropoff.latitude || !dropoff.longitude) {
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Pickup and dropoff locations must include latitude and longitude'
      });
    }
    
    // Validate latitude and longitude ranges
    if (pickup.latitude < -90 || pickup.latitude > 90 || 
        pickup.longitude < -180 || pickup.longitude > 180 ||
        dropoff.latitude < -90 || dropoff.latitude > 90 || 
        dropoff.longitude < -180 || dropoff.longitude > 180) {
      return res.status(400).json({
        error: 'invalid_coordinates',
        message: 'Latitude must be between -90 and 90, longitude must be between -180 and 180'
      });
    }
    
    // Calculate distance
    const distance = pricingService.calculateDistance(pickup, dropoff);
    
    // Return the distance
    res.status(200).json({ distance, unit: 'miles' });
  } catch (error) {
    console.error('Error in calculateDistance controller:', error);
    
    res.status(500).json({
      error: 'server_error',
      message: 'An error occurred while calculating the distance'
    });
  }
};

/**
 * Estimate travel time between two points
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const estimateTravelTime = (req, res) => {
  try {
    const { distance, timeOfDay } = req.body;
    
    // Validate request body
    if (distance === undefined) {
      return res.status(400).json({
        error: 'missing_required_field',
        message: 'Distance is required'
      });
    }
    
    // Validate distance
    if (isNaN(distance) || distance < 0) {
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Distance must be a non-negative number'
      });
    }
    
    // Validate time of day if provided
    if (timeOfDay && !['morning', 'afternoon', 'evening', 'night'].includes(timeOfDay)) {
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Time of day must be one of: morning, afternoon, evening, night'
      });
    }
    
    // Estimate travel time
    const travelTime = pricingService.estimateTravelTime(distance, timeOfDay);
    
    // Return the travel time
    res.status(200).json({ travelTime, unit: 'minutes' });
  } catch (error) {
    console.error('Error in estimateTravelTime controller:', error);
    
    res.status(500).json({
      error: 'server_error',
      message: 'An error occurred while estimating the travel time'
    });
  }
};

module.exports = {
  calculatePredictedFare,
  calculateActualFare,
  getSurgeMultiplier,
  calculateDistance,
  estimateTravelTime
};