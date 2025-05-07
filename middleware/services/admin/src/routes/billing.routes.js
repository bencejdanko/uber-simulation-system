const express = require('express');
const { getAllBills, getBillById } = require('../controllers/billing.controller');
const auth = require('../middlewares/auth');

const router = express.Router();

router.get('/', auth, getAllBills);
router.get('/:billing_id', auth, getBillById);

module.exports = router;
