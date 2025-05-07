const Driver = require('../models/driver.model');
const { sendDriverCreated } = require('../kafka/producer');

exports.createDriver = async (req, res) => {
  try {
    const driver = await Driver.create(req.body);
    await sendDriverCreated({
      eventType: 'PROFILE_CREATED',
      timestamp: new Date().toISOString(),
      ...driver.toObject()
    });
    res.status(201).json(driver);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findOne({ driverId: req.params.driver_id });
    if (!driver) return res.sendStatus(404);
    res.status(200).json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
