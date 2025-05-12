const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const controller = require('../controllers/customer.controller');

router.post('/', controller.createCustomer);
router.get('/:customer_id', controller.getCustomerById);

module.exports = router;
