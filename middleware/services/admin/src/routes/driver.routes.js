const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const controller = require('../controllers/driver.controller');

router.post('/', controller.createDriver);
router.get('/:driver_id', controller.getDriverById);

module.exports = router;
