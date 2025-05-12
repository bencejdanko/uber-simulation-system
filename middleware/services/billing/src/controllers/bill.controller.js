const billService = require('../services/bill.service');
const { SSNGenerator } = require('../utils/ssn-generator');

/**
 * Create a new bill
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createBill = async (req, res) => {
  try {
    // Validate request body
    const { 
      rideId, 
      customerId, 
      driverId, 
      date, 
      pickupTime, 
      dropoffTime, 
      distanceCovered,
      sourceLocation,
      destinationLocation,
      predictedAmount,
      actualAmount
    } = req.body;
    
    // Check required fields
    if (!rideId || !customerId || !driverId || !date || !pickupTime || !dropoffTime || 
        !distanceCovered || !sourceLocation || !destinationLocation || 
        !predictedAmount || !actualAmount) {
      return res.status(400).json({
        error: 'missing_required_field',
        message: 'Missing required fields'
      });
    }
    
    // Validate ID formats
    if (!SSNGenerator.validate(rideId)) {
      return res.status(400).json({
        error: 'invalid_id_format',
        message: 'Invalid ride ID format. Must be in SSN format (xxx-xx-xxxx)'
      });
    }
    
    if (!SSNGenerator.validate(customerId)) {
      return res.status(400).json({
        error: 'invalid_id_format',
        message: 'Invalid customer ID format. Must be in SSN format (xxx-xx-xxxx)'
      });
    }
    
    if (!SSNGenerator.validate(driverId)) {
      return res.status(400).json({
        error: 'invalid_id_format',
        message: 'Invalid driver ID format. Must be in SSN format (xxx-xx-xxxx)'
      });
    }
    
    // Validate location coordinates
    if (!sourceLocation.latitude || !sourceLocation.longitude ||
        !destinationLocation.latitude || !destinationLocation.longitude) {
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Source and destination locations must include latitude and longitude'
      });
    }
    
    // Validate numeric values
    if (isNaN(distanceCovered) || distanceCovered < 0) {
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Distance covered must be a non-negative number'
      });
    }
    
    if (isNaN(predictedAmount) || predictedAmount < 0) {
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Predicted amount must be a non-negative number'
      });
    }
    
    if (isNaN(actualAmount) || actualAmount < 0) {
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Actual amount must be a non-negative number'
      });
    }
    
    // Create the bill
    const bill = await billService.createBill(req.body);
    
    // Return the created bill with 201 status
    res.status(201).location(`/api/v1/bills/${bill.billingId}`).json(bill);
  } catch (error) {
    console.error('Error in createBill controller:', error);
    
    // Check for duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'duplicate_bill_for_ride',
        message: 'A bill for this ride already exists'
      });
    }
    
    res.status(500).json({
      error: 'server_error',
      message: 'An error occurred while creating the bill'
    });
  }
};

/**
 * Get a bill by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBillById = async (req, res) => {
  try {
    const { billing_id } = req.params;
    
    // Validate billing ID format
    if (!SSNGenerator.validate(billing_id)) {
      return res.status(400).json({
        error: 'invalid_billing_id_format',
        message: 'Invalid billing ID format. Must be in SSN format (xxx-xx-xxxx)'
      });
    }
    
    // Get the bill
    const bill = await billService.getBillById(billing_id);
    
    // Return the bill
    res.status(200).json(bill);
  } catch (error) {
    console.error(`Error in getBillById controller for ID ${req.params.billing_id}:`, error);
    
    // Check if bill not found
    if (error.message === 'Bill not found') {
      return res.status(404).json({
        error: 'bill_not_found',
        message: 'Bill not found'
      });
    }
    
    res.status(500).json({
      error: 'server_error',
      message: 'An error occurred while retrieving the bill'
    });
  }
};

/**
 * Search bills
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const searchBills = async (req, res) => {
  try {
    // Extract query parameters
    const { 
      customer_id, 
      driver_id, 
      ride_id, 
      payment_status,
      start_date,
      end_date,
      limit,
      offset
    } = req.query;
    
    // Validate ID formats if provided
    if (customer_id && !SSNGenerator.validate(customer_id)) {
      return res.status(400).json({
        error: 'invalid_id_format',
        message: 'Invalid customer ID format. Must be in SSN format (xxx-xx-xxxx)'
      });
    }
    
    if (driver_id && !SSNGenerator.validate(driver_id)) {
      return res.status(400).json({
        error: 'invalid_id_format',
        message: 'Invalid driver ID format. Must be in SSN format (xxx-xx-xxxx)'
      });
    }
    
    if (ride_id && !SSNGenerator.validate(ride_id)) {
      return res.status(400).json({
        error: 'invalid_id_format',
        message: 'Invalid ride ID format. Must be in SSN format (xxx-xx-xxxx)'
      });
    }
    
    // Validate payment status if provided
    if (payment_status && !['PENDING', 'PAID', 'FAILED', 'VOID'].includes(payment_status)) {
      return res.status(400).json({
        error: 'invalid_payment_status',
        message: 'Invalid payment status. Must be one of: PENDING, PAID, FAILED, VOID'
      });
    }
    
    // Validate date formats if provided
    if (start_date && isNaN(Date.parse(start_date))) {
      return res.status(400).json({
        error: 'invalid_date_format',
        message: 'Invalid start date format. Must be in YYYY-MM-DD format'
      });
    }
    
    if (end_date && isNaN(Date.parse(end_date))) {
      return res.status(400).json({
        error: 'invalid_date_format',
        message: 'Invalid end date format. Must be in YYYY-MM-DD format'
      });
    }
    
    // Validate limit and offset if provided
    const parsedLimit = limit ? parseInt(limit) : 20;
    const parsedOffset = offset ? parseInt(offset) : 0;
    
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({
        error: 'invalid_query_parameter',
        message: 'Limit must be a positive integer'
      });
    }
    
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        error: 'invalid_query_parameter',
        message: 'Offset must be a non-negative integer'
      });
    }
    
    // Search bills
    const result = await billService.searchBills(
      { customer_id, driver_id, ride_id, payment_status, start_date, end_date },
      parsedLimit,
      parsedOffset
    );
    
    // Set pagination headers
    res.set('X-Total-Count', result.count);
    res.set('X-Limit', result.limit);
    res.set('X-Offset', result.offset);
    
    // Return the bills
    res.status(200).json(result.bills);
  } catch (error) {
    console.error('Error in searchBills controller:', error);
    
    res.status(500).json({
      error: 'server_error',
      message: 'An error occurred while searching bills'
    });
  }
};

/**
 * Delete a bill
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteBill = async (req, res) => {
  try {
    const { billing_id } = req.params;
    
    // Validate billing ID format
    if (!SSNGenerator.validate(billing_id)) {
      return res.status(400).json({
        error: 'invalid_billing_id_format',
        message: 'Invalid billing ID format. Must be in SSN format (xxx-xx-xxxx)'
      });
    }
    
    // Delete the bill
    await billService.deleteBill(billing_id);
    
    // Return success with no content
    res.status(204).end();
  } catch (error) {
    console.error(`Error in deleteBill controller for ID ${req.params.billing_id}:`, error);
    
    // Check if bill not found
    if (error.message === 'Bill not found') {
      return res.status(404).json({
        error: 'bill_not_found',
        message: 'Bill not found'
      });
    }
    
    res.status(500).json({
      error: 'server_error',
      message: 'An error occurred while deleting the bill'
    });
  }
};

/**
 * Update bill payment status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { billing_id } = req.params;
    const { status, paymentDetails } = req.body;
    
    // Validate billing ID format
    if (!SSNGenerator.validate(billing_id)) {
      return res.status(400).json({
        error: 'invalid_billing_id_format',
        message: 'Invalid billing ID format. Must be in SSN format (xxx-xx-xxxx)'
      });
    }
    
    // Validate status
    if (!status || !['PENDING', 'PAID', 'FAILED', 'VOID'].includes(status)) {
      return res.status(400).json({
        error: 'invalid_payment_status',
        message: 'Invalid payment status. Must be one of: PENDING, PAID, FAILED, VOID'
      });
    }
    
    // Update the payment status
    const bill = await billService.updatePaymentStatus(billing_id, status, paymentDetails);
    
    // Return the updated bill
    res.status(200).json(bill);
  } catch (error) {
    console.error(`Error in updatePaymentStatus controller for ID ${req.params.billing_id}:`, error);
    
    // Check if bill not found
    if (error.message === 'Bill not found') {
      return res.status(404).json({
        error: 'bill_not_found',
        message: 'Bill not found'
      });
    }
    
    res.status(500).json({
      error: 'server_error',
      message: 'An error occurred while updating the payment status'
    });
  }
};

/**
 * Get revenue statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getRevenueStats = async (req, res) => {
  try {
    const { start_date, end_date, group_by } = req.query;
    
    // Validate date formats
    if (!start_date || isNaN(Date.parse(start_date))) {
      return res.status(400).json({
        error: 'invalid_date_format',
        message: 'Invalid or missing start date. Must be in YYYY-MM-DD format'
      });
    }
    
    if (!end_date || isNaN(Date.parse(end_date))) {
      return res.status(400).json({
        error: 'invalid_date_format',
        message: 'Invalid or missing end date. Must be in YYYY-MM-DD format'
      });
    }
    
    // Validate group_by if provided
    if (group_by && !['day', 'week', 'month'].includes(group_by)) {
      return res.status(400).json({
        error: 'invalid_query_parameter',
        message: 'Invalid group_by parameter. Must be one of: day, week, month'
      });
    }
    
    // Get revenue statistics
    const stats = await billService.getRevenueStats(
      new Date(start_date),
      new Date(end_date),
      group_by || 'day'
    );
    
    // Return the statistics
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error in getRevenueStats controller:', error);
    
    res.status(500).json({
      error: 'server_error',
      message: 'An error occurred while retrieving revenue statistics'
    });
  }
};

module.exports = {
  createBill,
  getBillById,
  searchBills,
  deleteBill,
  updatePaymentStatus,
  getRevenueStats
};