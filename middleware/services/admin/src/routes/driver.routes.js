const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const controller = require('../controllers/driver.controller');

router.post('/', auth, controller.createDriver);
router.get('/:driver_id', auth, controller.getDriverById);

module.exports = router;
