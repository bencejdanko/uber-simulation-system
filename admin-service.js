const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const { connectDB } = require('./utils/mongodb');
const { Customer, Driver, Ride, Bill } = require('./models');
require('dotenv').config();

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Utility functions
const updateStatistics = async () => {
  try {
    // Calculate statistics based on database data
    const totalDrivers = await Driver.countDocuments();
    const activeDrivers = await Driver.countDocuments({ status: 'ACTIVE' });
    
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: 'ACTIVE' });
    
    const totalRides = await Ride.countDocuments();
    
    // Calculate total revenue from completed rides
    const completedRides = await Ride.find({ status: 'COMPLETED' });
    let totalRevenue = 0;
    completedRides.forEach(ride => {
      if (ride.fare) totalRevenue += parseFloat(ride.fare);
    });

    // Get rides by city
    const rides = await Ride.find();
    const cityCounts = {};
    rides.forEach(ride => {
      const city = ride.pickup.split(',')[1]?.trim() || 'Unknown';
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });
    
    const ridesByCity = Object.keys(cityCounts).map(city => ({
      city,
      value: cityCounts[city]
    }));

    // Get rides by hour
    const ridesByHour = Array.from({ length: 24 }, (_, i) => ({ hour: i, rides: 0 }));
    rides.forEach(ride => {
      const hour = new Date(ride.requestTime).getHours();
      ridesByHour[hour].rides += 1;
    });

    // Get revenue by day of week
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const revenueDayData = dayNames.map(day => ({ day, revenue: 0 }));

    completedRides.forEach(ride => {
      if (ride.fare) {
        const day = new Date(ride.dropoffTime).getDay();
        revenueDayData[day].revenue += parseFloat(ride.fare);
      }
    });

    // Create overview statistics object
    const statistics = {
      overview: {
        totalRides,
        totalDrivers,
        totalCustomers,
        totalRevenue,
        activeDrivers,
        activeCustomers
      },
      ridesByCity,
      ridesByHour,
      revenueByDay: revenueDayData
    };
    
    // Broadcast updates
    io.to('admin-dashboard').emit('dashboard-update:overview', statistics.overview);
    io.to('admin-dashboard').emit('dashboard-update:rides', {
      ridesByCity: statistics.ridesByCity,
      ridesByHour: statistics.ridesByHour
    });

    return statistics;
  } catch (error) {
    console.error('Error updating statistics:', error);
    throw error;
  }
};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join admin dashboard room
  socket.join('admin-dashboard');
  
  // Send initial stats when client connects
  updateStatistics()
    .then(statistics => {
      socket.emit('dashboard-update:overview', statistics.overview);
      socket.emit('dashboard-update:rides', {
        ridesByCity: statistics.ridesByCity,
        ridesByHour: statistics.ridesByHour
      });
    })
    .catch(err => console.error('Error sending initial stats:', err));
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// API Endpoints for Statistics
app.get('/api/v1/admin/statistics/overview', async (req, res) => {
  try {
    const statistics = await updateStatistics();
    res.json(statistics.overview);
  } catch (error) {
    console.error('Error fetching overview statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

app.get('/api/v1/admin/statistics/rides-by-city', async (req, res) => {
  try {
    const statistics = await updateStatistics();
    res.json(statistics.ridesByCity);
  } catch (error) {
    console.error('Error fetching city statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

app.get('/api/v1/admin/statistics/rides-by-hour', async (req, res) => {
  try {
    const statistics = await updateStatistics();
    res.json(statistics.ridesByHour);
  } catch (error) {
    console.error('Error fetching hour statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

app.get('/api/v1/admin/statistics/revenue-by-day', async (req, res) => {
  try {
    const statistics = await updateStatistics();
    res.json(statistics.revenueByDay);
  } catch (error) {
    console.error('Error fetching revenue statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// API Endpoints for Customers
app.get('/api/v1/admin/customers', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json({ data: customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/v1/admin/customers', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, status } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }
    
    // Create new customer
    const customer = new Customer({
      firstName,
      lastName,
      email,
      phone,
      status: status || 'ACTIVE',
      ridesCount: 0,
      totalSpent: 0
    });
    
    // Save to database
    await customer.save();
    
    // Update statistics
    await updateStatistics();
    
    // Return success response
    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer added successfully'
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.put('/api/v1/admin/customers/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    const updateData = req.body;
    
    // Find and update customer
    const customer = await Customer.findByIdAndUpdate(
      customerId,
      { ...updateData, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Update statistics
    await updateStatistics();
    
    // Return success response
    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// API Endpoints for Drivers
app.get('/api/v1/admin/drivers', async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json({ data: drivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

app.post('/api/v1/admin/drivers', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, carDetails, status } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !carDetails) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }
    
    // Create new driver
    const driver = new Driver({
      firstName,
      lastName,
      email,
      phone,
      carDetails,
      status: status || 'ACTIVE',
      rating: 0,
      ridesCount: 0
    });
    
    // Save to database
    await driver.save();
    
    // Update statistics
    await updateStatistics();
    
    // Return success response
    res.status(201).json({
      success: true,
      data: driver,
      message: 'Driver added successfully'
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

app.put('/api/v1/admin/drivers/:id', async (req, res) => {
  try {
    const driverId = req.params.id;
    const updateData = req.body;
    
    // Find and update driver
    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { ...updateData, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Update statistics
    await updateStatistics();
    
    // Return success response
    res.json({
      success: true,
      data: driver,
      message: 'Driver updated successfully'
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

// API Endpoints for Bills
app.get('/api/v1/admin/bills', async (req, res) => {
  try {
    const bills = await Bill.find();
    res.json({ data: bills });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

app.post('/api/v1/admin/bills', async (req, res) => {
  try {
    const { rideId, customer, customerId, driver, driverId, source, destination, amount, paymentMethod } = req.body;
    
    // Validate required fields
    if (!rideId || !customer || !customerId || !driver || !driverId || !source || !destination || !amount) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }
    
    // Create new bill
    const bill = new Bill({
      rideId,
      date: new Date(),
      amount: parseFloat(amount),
      customer,
      customerId,
      driver,
      driverId,
      source,
      destination,
      paymentMethod: paymentMethod || 'CASH',
      paymentStatus: 'COMPLETED'
    });
    
    // Save to database
    await bill.save();
    
    // Update customer's total spent and rides count
    await Customer.findByIdAndUpdate(
      customerId,
      { 
        $inc: { 
          ridesCount: 1, 
          totalSpent: parseFloat(amount) 
        },
        updatedAt: Date.now()
      }
    );
    
    // Update driver's rides count
    await Driver.findByIdAndUpdate(
      driverId,
      { 
        $inc: { ridesCount: 1 },
        updatedAt: Date.now()
      }
    );
    
    // Update statistics
    await updateStatistics();
    
    // Return success response
    res.status(201).json({
      success: true,
      data: bill,
      message: 'Bill added successfully'
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ error: 'Failed to create bill' });
  }
});

// API Endpoints for Rides
app.get('/api/v1/admin/rides', async (req, res) => {
  try {
    const { status, startDate, endDate, search } = req.query;
    let query = {};
    
    // Filter by status if provided
    if (status && status !== 'ALL') {
      query.status = status;
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
      query.requestTime = {};
      if (startDate) {
        query.requestTime.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set time to end of day
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.requestTime.$lte = endDateObj;
      }
    }
    
    // Perform search
    let rides = await Ride.find(query);
    
    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      rides = rides.filter(ride => 
        ride._id.toString().includes(searchLower) ||
        ride.customerName.toLowerCase().includes(searchLower) ||
        (ride.driverName && ride.driverName.toLowerCase().includes(searchLower)) ||
        ride.pickup.toLowerCase().includes(searchLower) ||
        ride.destination.toLowerCase().includes(searchLower)
      );
    }
    
    res.json({ data: rides });
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

app.get('/api/v1/admin/rides/:id', async (req, res) => {
  try {
    const rideId = req.params.id;
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }
    
    res.json({
      success: true,
      data: ride
    });
  } catch (error) {
    console.error('Error fetching ride:', error);
    res.status(500).json({ error: 'Failed to fetch ride' });
  }
});

app.post('/api/v1/admin/rides', async (req, res) => {
  try {
    const { customerId, driverId, pickup, destination, status, estimatedFare, estimatedDistance, scheduledTime } = req.body;
    
    // Validate required fields
    if (!customerId || !pickup || !destination) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }
    
    // Find customer and driver
    const customer = await Customer.findById(customerId);
    const driver = driverId ? await Driver.findById(driverId) : null;
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Create new ride
    const ride = new Ride({
      customerId,
      driverId: driverId || null,
      customerName: `${customer.firstName} ${customer.lastName}`,
      driverName: driver ? `${driver.firstName} ${driver.lastName}` : null,
      requestTime: new Date(),
      pickup,
      destination,
      status: status || 'SCHEDULED',
      estimatedFare: estimatedFare || 0,
      estimatedDistance: estimatedDistance || 0,
      scheduledTime: scheduledTime || null
    });
    
    // Save to database
    await ride.save();
    
    // Update statistics
    await updateStatistics();
    
    // Return success response
    res.status(201).json({
      success: true,
      data: ride,
      message: 'Ride added successfully'
    });
  } catch (error) {
    console.error('Error creating ride:', error);
    res.status(500).json({ error: 'Failed to create ride' });
  }
});

app.put('/api/v1/admin/rides/:id', async (req, res) => {
  try {
    const rideId = req.params.id;
    const updateData = req.body;
    
    // Find ride
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }
    
    // Check if changing status to COMPLETED
    const isCompletingRide = updateData.status === 'COMPLETED' && ride.status !== 'COMPLETED';
    
    // Update ride
    Object.assign(ride, { ...updateData, updatedAt: Date.now() });
    await ride.save();
    
    // If completing a ride, update customer and driver stats, and create bill
    if (isCompletingRide && ride.fare) {
      // Update customer stats
      await Customer.findByIdAndUpdate(
        ride.customerId,
        { 
          $inc: { 
            ridesCount: 1, 
            totalSpent: parseFloat(ride.fare) 
          },
          updatedAt: Date.now()
        }
      );
      
      // Update driver stats
      if (ride.driverId) {
        await Driver.findByIdAndUpdate(
          ride.driverId,
          { 
            $inc: { ridesCount: 1 },
            updatedAt: Date.now()
          }
        );
      }
      
      // Create bill for completed ride
      const bill = new Bill({
        rideId: ride._id,
        date: ride.dropoffTime || new Date(),
        amount: parseFloat(ride.fare),
        customer: ride.customerName,
        customerId: ride.customerId,
        driver: ride.driverName,
        driverId: ride.driverId,
        source: ride.pickup,
        destination: ride.destination,
        paymentMethod: ride.paymentMethod || 'CASH',
        paymentStatus: 'COMPLETED'
      });
      
      await bill.save();
    }
    
    // Update statistics
    await updateStatistics();
    
    // Return success response
    res.json({
      success: true,
      data: ride,
      message: 'Ride updated successfully'
    });
  } catch (error) {
    console.error('Error updating ride:', error);
    res.status(500).json({ error: 'Failed to update ride' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'admin-service' });
});

// Connect to MongoDB and start the server
const PORT = process.env.PORT || 8001;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Admin service running on port ${PORT}`);
      console.log('Real-time updates enabled');
      console.log('MongoDB connected successfully');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 