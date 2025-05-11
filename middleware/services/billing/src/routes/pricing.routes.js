const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricing.controller');

/**
 * @route   GET /api/v1/pricing/predict
 * @desc    Calculate predicted fare
 * @access  Private
 */
router.get('/predict', pricingController.calculatePredictedFare);

/**
 * @route   POST /api/v1/pricing/actual
 * @desc    Calculate actual fare
 * @access  Private
 */
router.post('/actual', pricingController.calculateActualFare);

/**
 * @route   GET /api/v1/pricing/surge
 * @desc    Get surge multiplier for a location
 * @access  Private
 */
router.get('/surge', pricingController.getSurgeMultiplier);

/**
 * @route   POST /api/v1/pricing/distance
 * @desc    Calculate distance between two points
 * @access  Private
 */
router.post('/distance', pricingController.calculateDistance);

/**
 * @route   POST /api/v1/pricing/time
 * @desc    Estimate travel time
 * @access  Private
 */
router.post('/time', pricingController.estimateTravelTime);

module.exports = router;