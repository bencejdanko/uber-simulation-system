const express = require('express');
const { getAllBills, getBillById } = require('../controllers/billing.controller');
const auth = require('../middlewares/auth');

const router = express.Router();

router.get('/', getAllBills);
router.get('/:billing_id', getBillById);

module.exports = router;
