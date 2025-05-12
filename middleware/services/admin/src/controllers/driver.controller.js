const { Driver } = require('../models/driver.model');
const mongoose = require('mongoose');
const { sendDriverCreated } = require('../kafka/producer');

/**
 * Get all drivers with optional filtering and pagination
 */
exports.getAllDrivers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Build query
    const query = {};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Add status filter
    if (status) {
      query.status = status.toUpperCase();
    }
    
    // Calculate total documents for pagination
    const totalDrivers = await Driver.countDocuments(query);
    const totalPages = Math.ceil(totalDrivers / limitNum);
    
    // Fetch paginated drivers
    const drivers = await Driver.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    
    return res.status(200).json({
      data: drivers,
      currentPage: pageNum,
      totalPages,
      totalDrivers
    });
  } catch (err) {
    console.error('Error fetching drivers:', err);
    return res.status(500).json({ error: 'Failed to fetch drivers' });
  }
};

/**
 * Get a single driver by ID
 */
exports.getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid driver ID' });
    }
    
    const driver = await Driver.findById(id);
    
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    return res.status(200).json(driver);
  } catch (err) {
    console.error('Error fetching driver:', err);
    return res.status(500).json({ error: 'Failed to fetch driver' });
  }
};

/**
 * Create a new driver
 */
exports.createDriver = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      city,
      state,
      zipCode,
      licenseNumber,
      carModel,
      carColor,
      carYear,
      status
    } = req.body;
    
    // Check if driver with email already exists
    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      return res.status(409).json({ error: 'Driver with this email already exists' });
    }
    
    // Create new driver
    const driver = new Driver({
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      city,
      state,
      zipCode,
      licenseNumber,
      carModel,
      carColor,
      carYear,
      status: status || 'ACTIVE'
    });
    
    await driver.save();
    
    await sendDriverCreated({
      eventType: 'PROFILE_CREATED',
      timestamp: new Date().toISOString(),
      ...driver.toObject()
    });
    
    return res.status(201).json(driver);
  } catch (err) {
    console.error('Error creating driver:', err);
    return res.status(500).json({ error: 'Failed to create driver' });
  }
};

/**
 * Update an existing driver
 */
exports.updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid driver ID' });
    }
    
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      city,
      state,
      zipCode,
      licenseNumber,
      carModel,
      carColor,
      carYear,
      status
    } = req.body;
    
    // Check if email is being changed and already exists
    if (email) {
      const existingDriver = await Driver.findOne({ email, _id: { $ne: id } });
      if (existingDriver) {
        return res.status(409).json({ error: 'Driver with this email already exists' });
      }
    }
    
    const updatedDriver = await Driver.findByIdAndUpdate(
      id,
      {
        firstName,
        lastName,
        email,
        phoneNumber,
        address,
        city,
        state,
        zipCode,
        licenseNumber,
        carModel,
        carColor,
        carYear,
        status
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    return res.status(200).json(updatedDriver);
  } catch (err) {
    console.error('Error updating driver:', err);
    return res.status(500).json({ error: 'Failed to update driver' });
  }
};

/**
 * Delete a driver
 */
exports.deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid driver ID' });
    }
    
    const deletedDriver = await Driver.findByIdAndDelete(id);
    
    if (!deletedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    return res.status(200).json({ message: 'Driver deleted successfully' });
  } catch (err) {
    console.error('Error deleting driver:', err);
    return res.status(500).json({ error: 'Failed to delete driver' });
  }
};

/**
 * Get driver statistics
 */
exports.getDriverStats = async (req, res) => {
  try {
    // Count total drivers
    const totalDrivers = await Driver.countDocuments();
    
    // Count active drivers
    const activeDrivers = await Driver.countDocuments({ status: 'ACTIVE' });
    
    // Count inactive drivers
    const inactiveDrivers = await Driver.countDocuments({ status: 'INACTIVE' });
    
    // Count suspended drivers
    const suspendedDrivers = await Driver.countDocuments({ status: 'SUSPENDED' });
    
    // Drivers by city
    const driversByCity = await Driver.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { city: '$_id', count: 1, _id: 0 } }
    ]);
    
    // Recently joined drivers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentDrivers = await Driver.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    return res.status(200).json({
      totalDrivers,
      activeDrivers,
      inactiveDrivers,
      suspendedDrivers,
      driversByCity,
      recentDrivers
    });
  } catch (err) {
    console.error('Error fetching driver statistics:', err);
    return res.status(500).json({ error: 'Failed to fetch driver statistics' });
  }
};
