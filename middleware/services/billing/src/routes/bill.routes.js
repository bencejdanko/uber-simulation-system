const express = require('express');
const router = express.Router();
const billController = require('../controllers/bill.controller');

/**
 * @route   POST /api/v1/bills
 * @desc    Create a new bill
 * @access  Private
 */
router.post('/', billController.createBill);

/**
 * @route   GET /api/v1/bills/:billing_id
 * @desc    Get a bill by ID
 * @access  Private
 */
router.get('/:billing_id', billController.getBillById);

/**
 * @route   GET /api/v1/bills
 * @desc    Search bills
 * @access  Private
 */
router.get('/', billController.searchBills);

/**
 * @route   DELETE /api/v1/bills/:billing_id
 * @desc    Delete a bill
 * @access  Private (Admin)
 */
router.delete('/:billing_id', billController.deleteBill);

/**
 * @route   PATCH /api/v1/bills/:billing_id/payment
 * @desc    Update bill payment status
 * @access  Private
 */
router.patch('/:billing_id/payment', billController.updatePaymentStatus);

/**
 * @route   GET /api/v1/bills/stats/revenue
 * @desc    Get revenue statistics
 * @access  Private (Admin)
 */
router.get('/stats/revenue', billController.getRevenueStats);

module.exports = router;