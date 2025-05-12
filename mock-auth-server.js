const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3001;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uber-simulation';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define admin user schema
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, default: 'Admin' },
  lastName: { type: String, default: 'User' },
  role: { type: String, default: 'ADMIN' }
});

// Create the Admin model
const Admin = mongoose.model('Admin', adminSchema);

// Create default admin if it doesn't exist
async function createDefaultAdmin() {
  try {
    const existingAdmin = await Admin.findOne({ email: 'admin@uber.com' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const defaultAdmin = new Admin({
        email: 'admin@uber.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN'
      });
      await defaultAdmin.save();
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
}

// Call the function to ensure default admin exists
createDefaultAdmin();

// Enable CORS for all origins with correct configuration
app.use(cors({
  origin: '*',  // Allow all origins
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(bodyParser.json());

// JWT Secret for token generation
const JWT_SECRET = 'uber-simulation-system-default-secret';

// Admin login endpoint
app.post('/api/v1/auth/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', email);
    
    // Find admin in database
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin credentials'
      });
    }
    
    // Check if using default credentials or verify password
    const isDefaultCredentials = email === 'admin@uber.com' && password === 'admin123';
    const isValidPassword = isDefaultCredentials || await bcrypt.compare(password, admin.password);
    
    if (isValidPassword) {
      // Generate JWT token
      const tokenPayload = {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        roles: [admin.role],
        firstName: admin.firstName,
        lastName: admin.lastName
      };
      
      const token = jwt.sign(tokenPayload, JWT_SECRET, { 
        expiresIn: '1d',
        issuer: 'https://my-auth-service.com'
      });
      
      return res.json({
        success: true,
        data: {
          user: {
            id: admin._id,
            email: admin.email,
            role: admin.role,
            roles: [admin.role],
            firstName: admin.firstName,
            lastName: admin.lastName
          },
          token
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
});

// Admin user management endpoints

// Get all admins
app.get('/api/v1/admin/users', async (req, res) => {
  try {
    const admins = await Admin.find({}, { password: 0 }); // Exclude passwords
    res.json({ success: true, data: admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch admins' });
  }
});

// Create new admin
app.post('/api/v1/admin/users', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, error: 'Admin with this email already exists' });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new admin
    const newAdmin = new Admin({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'ADMIN'
    });
    
    await newAdmin.save();
    
    // Return created admin without password
    const adminData = newAdmin.toObject();
    delete adminData.password;
    
    res.status(201).json({ success: true, data: adminData });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ success: false, error: 'Failed to create admin' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Define more MongoDB schemas for data
const customerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  registrationDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' }
});

const driverSchema = new mongoose.Schema({
  _id: { type: String, required: false }, // SSN Format Driver ID
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  vehicle: {
    make: String,
    model: String,
    year: Number,
    color: String,
    licensePlate: String
  },
  licenseNumber: { type: String },
  rating: { type: Number, default: 4.5 },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  location: {
    latitude: Number,
    longitude: Number,
    lastUpdated: { type: Date, default: Date.now }
  },
  introduction: {
    images: [String],  // URLs to images
    video: String      // URL to video
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const rideSchema = new mongoose.Schema({
  customerId: { type: String, ref: 'Customer' },
  driverId: { type: String, ref: 'Driver' },
  pickup: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  dropoff: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  status: { 
    type: String, 
    enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'], 
    default: 'requested'
  },
  requestTime: { type: Date, default: Date.now },
  completionTime: { type: Date },
  fare: { type: Number },
  distance: { type: Number }, // in miles
  duration: { type: Number }, // in minutes
  rating: { type: Number }
});

const reviewSchema = new mongoose.Schema({
  _id: { type: String, required: false },
  reviewerId: { type: String, required: true }, // Customer ID
  revieweeId: { type: String, required: true }, // Driver ID
  reviewerType: { type: String, enum: ['customer', 'driver'], required: true },
  revieweeType: { type: String, enum: ['customer', 'driver'], required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  timestamp: { type: Date, default: Date.now }
});

// Create models
const Customer = mongoose.model('Customer', customerSchema);
const Driver = mongoose.model('Driver', driverSchema);
const Ride = mongoose.model('Ride', rideSchema);
const Review = mongoose.model('Review', reviewSchema);

// Create sample data
async function createSampleData() {
  try {
    // Check if data already exists
    const customerCount = await Customer.countDocuments();
    const driverCount = await Driver.countDocuments();
    const reviewCount = await Review.countDocuments();
    const rideCount = await Ride.countDocuments();
    
    if (customerCount === 0) {
      // Create sample customers
      const sampleCustomers = [
        {
          _id: '987-65-4321',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '555-123-4567'
        },
        {
          _id: '987-65-4322',
          email: 'jane.smith@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '555-765-4321'
        },
        {
          _id: '987-65-4323',
          email: 'robert.johnson@example.com',
          firstName: 'Robert',
          lastName: 'Johnson',
          phone: '555-987-6543'
        }
      ];
      
      await Customer.insertMany(sampleCustomers);
      console.log('Sample customers created');
    }
    
    if (driverCount === 0) {
      // Create sample drivers
      const sampleDrivers = [
        {
          _id: '123-45-6789',
          email: 'michael.driver@example.com',
          firstName: 'Michael',
          lastName: 'Driver',
          phone: '555-123-9876',
          address: '123 Main Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          vehicle: {
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            color: 'Silver',
            licensePlate: 'ABC123'
          },
          licenseNumber: 'DL123456',
          rating: 4.8,
          location: {
            latitude: 37.7749,
            longitude: -122.4194
          },
          introduction: {
            images: ['https://example.com/driver1/img1.jpg', 'https://example.com/driver1/img2.jpg'],
            video: 'https://example.com/driver1/intro.mp4'
          }
        },
        {
          _id: '123-45-6790',
          email: 'sarah.driver@example.com',
          firstName: 'Sarah',
          lastName: 'Driver',
          phone: '555-456-7890',
          address: '456 Oak Avenue',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94107',
          vehicle: {
            make: 'Honda',
            model: 'Accord',
            year: 2019,
            color: 'Black',
            licensePlate: 'XYZ789'
          },
          licenseNumber: 'DL789012',
          rating: 4.9,
          location: {
            latitude: 37.7833,
            longitude: -122.4167
          },
          introduction: {
            images: ['https://example.com/driver2/img1.jpg'],
            video: 'https://example.com/driver2/intro.mp4'
          }
        }
      ];
      
      await Driver.insertMany(sampleDrivers);
      console.log('Sample drivers created');
    }
    
    // Create sample rides
    if (rideCount === 0) {
      const customers = await Customer.find().limit(3);
      const drivers = await Driver.find().limit(2);
      
      if (customers.length > 0 && drivers.length > 0) {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const twoDaysAgo = new Date(now);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        const sampleRides = [
          {
            _id: 'ride123',
            customerId: customers[0]._id,
            driverId: drivers[0]._id,
            pickup: {
              latitude: 37.7749,
              longitude: -122.4194,
              address: '123 Market St, San Francisco, CA'
            },
            dropoff: {
              latitude: 37.7833,
              longitude: -122.4167,
              address: '456 Mission St, San Francisco, CA'
            },
            status: 'completed',
            requestTime: yesterday,
            completionTime: now,
            fare: 25.50,
            distance: 3.2,
            duration: 15,
            rating: 5
          },
          {
            _id: 'ride124',
            customerId: customers[1]._id,
            driverId: drivers[1]._id,
            pickup: {
              latitude: 37.7833,
              longitude: -122.4167,
              address: '789 Howard St, San Francisco, CA'
            },
            dropoff: {
              latitude: 37.7749,
              longitude: -122.4194,
              address: '101 Van Ness Ave, San Francisco, CA'
            },
            status: 'completed',
            requestTime: twoDaysAgo,
            completionTime: yesterday,
            fare: 18.75,
            distance: 2.8,
            duration: 12,
            rating: 4
          },
          {
            _id: 'ride125',
            customerId: customers[2]._id || customers[0]._id,
            driverId: drivers[0]._id,
            pickup: {
              latitude: 37.7833,
              longitude: -122.4167,
              address: '888 Brannan St, San Francisco, CA'
            },
            dropoff: {
              latitude: 37.7749,
              longitude: -122.4194,
              address: '555 California St, San Francisco, CA'
            },
            status: 'completed',
            requestTime: new Date(now - 5 * 60 * 60 * 1000), // 5 hours ago
            completionTime: new Date(now - 4 * 60 * 60 * 1000), // 4 hours ago
            fare: 32.25,
            distance: 4.5,
            duration: 20,
            rating: 5
          },
          {
            _id: 'ride126',
            customerId: customers[0]._id,
            driverId: drivers[1]._id,
            pickup: {
              latitude: 37.7833,
              longitude: -122.4167,
              address: '1 Embarcadero Center, San Francisco, CA'
            },
            dropoff: {
              latitude: 37.7749,
              longitude: -122.4194,
              address: 'Union Square, San Francisco, CA'
            },
            status: 'in_progress',
            requestTime: new Date(),
            fare: 15.00,
            distance: 1.8,
            duration: 10
          }
        ];
        
        await Ride.insertMany(sampleRides);
        console.log('Sample rides created');
      }
    }
    
    // Create sample reviews if none exist
    if (reviewCount === 0) {
      const customers = await Customer.find().limit(3);
      const drivers = await Driver.find().limit(2);
      
      if (customers.length > 0 && drivers.length > 0) {
        const sampleReviews = [
          {
            _id: 'rev001',
            reviewerId: customers[0]._id || '987-65-4321',
            revieweeId: drivers[0]._id || '123-45-6789',
            reviewerType: 'customer',
            revieweeType: 'driver',
            rating: 5,
            comment: 'Great ride, very smooth and polite driver!',
            timestamp: new Date()
          },
          {
            _id: 'rev002',
            reviewerId: customers[1]._id || '987-65-4322',
            revieweeId: drivers[0]._id || '123-45-6789',
            reviewerType: 'customer',
            revieweeType: 'driver',
            rating: 4,
            comment: 'Good ride, but was a bit late.',
            timestamp: new Date(Date.now() - 86400000) // 1 day ago
          },
          {
            _id: 'rev003',
            reviewerId: customers[2]._id || '987-65-4323',
            revieweeId: drivers[1]._id || '123-45-6790', 
            reviewerType: 'customer',
            revieweeType: 'driver',
            rating: 5,
            comment: 'Excellent service, very friendly!',
            timestamp: new Date(Date.now() - 172800000) // 2 days ago
          }
        ];
        
        await Review.insertMany(sampleReviews);
        console.log('Sample reviews created');
      }
    }
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

// Call the function to create sample data
createSampleData();

// Add these new endpoints after the existing ones

// API Routes for Admin Dashboard

// Customers
app.get('/api/v1/admin/customers', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

app.get('/api/v1/admin/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer' });
  }
});

// Drivers
app.get('/api/v1/admin/drivers', async (req, res) => {
  try {
    const drivers = await Driver.find();
    
    // Enhanced driver data with additional statistics
    const enhancedDrivers = await Promise.all(drivers.map(async (driver) => {
      // Count reviews
      const reviewCount = await Review.countDocuments({ 
        revieweeId: driver._id,
        revieweeType: 'driver'
      });
      
      // Count rides
      const rideCount = await Ride.countDocuments({ driverId: driver._id });
      
      // Count completed rides
      const completedRideCount = await Ride.countDocuments({ 
        driverId: driver._id,
        status: 'completed'
      });
      
      // Get last active time (most recent ride)
      const lastRide = await Ride.findOne({ driverId: driver._id })
        .sort({ requestTime: -1 });
      
      return {
        ...driver.toObject(),
        reviewCount,
        rideCount,
        completedRideCount,
        lastActive: lastRide ? lastRide.requestTime : driver.updatedAt
      };
    }));
    
    res.json({ success: true, data: enhancedDrivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch drivers' });
  }
});

app.get('/api/v1/admin/drivers/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    
    // Get driver's reviews
    const reviews = await Review.find({
      revieweeId: req.params.id,
      revieweeType: 'driver'
    }).sort({ timestamp: -1 }).limit(5);
    
    // Get driver's rides
    const rides = await Ride.find({
      driverId: req.params.id
    }).sort({ requestTime: -1 }).limit(5);
    
    // Calculate average rating if it has reviews
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      driver.rating = (totalRating / reviews.length).toFixed(1);
      await driver.save(); // Save updated rating
    }
    
    // Return driver with reviews and rides
    res.json({ 
      success: true, 
      data: {
        driver,
        reviews,
        rides,
        reviewCount: reviews.length,
        rideCount: rides.length
      }
    });
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch driver' });
  }
});

// Rides
app.get('/api/v1/admin/rides', async (req, res) => {
  try {
    const rides = await Ride.find()
      .populate('customerId', 'firstName lastName email')
      .populate('driverId', 'firstName lastName email');
    res.json({ success: true, data: rides });
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch rides' });
  }
});

app.get('/api/v1/admin/rides/:id', async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('customerId', 'firstName lastName email')
      .populate('driverId', 'firstName lastName email');
    if (!ride) {
      return res.status(404).json({ success: false, error: 'Ride not found' });
    }
    res.json({ success: true, data: ride });
  } catch (error) {
    console.error('Error fetching ride:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ride' });
  }
});

// Dashboard statistics
app.get('/api/v1/admin/statistics', async (req, res) => {
  try {
    const customerCount = await Customer.countDocuments();
    const driverCount = await Driver.countDocuments();
    const rideCount = await Ride.countDocuments();
    const completedRides = await Ride.countDocuments({ status: 'completed' });
    
    // Calculate total revenue from completed rides
    const rides = await Ride.find({ status: 'completed' });
    let totalRevenue = rides.reduce((total, ride) => total + (ride.fare || 0), 0);
    
    // If there's no revenue or very little, provide sample data for UI
    if (totalRevenue < 1000) {
      console.log("Low or no actual revenue found, using enhanced sample revenue data");
      
      // Create more sample completed rides with fare data if none exist
      if (rides.length < 5) {
        const customers = await Customer.find().limit(3);
        const drivers = await Driver.find().limit(2);
        
        if (customers.length > 0 && drivers.length > 0) {
          console.log("Creating additional sample rides with revenue data");
          
          const now = new Date();
          const yesterdayStart = new Date(now);
          yesterdayStart.setDate(yesterdayStart.getDate() - 1);
          yesterdayStart.setHours(0, 0, 0, 0);
          
          const yesterdayEnd = new Date(now);
          yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
          yesterdayEnd.setHours(23, 59, 59, 999);
          
          // Generate random timestamps within yesterday
          const getRandomTimestamp = () => {
            return new Date(
              yesterdayStart.getTime() + 
              Math.random() * (yesterdayEnd.getTime() - yesterdayStart.getTime())
            );
          };
          
          // Create 10 additional sample completed rides
          const additionalRides = [];
          
          for (let i = 0; i < 10; i++) {
            const requestTime = getRandomTimestamp();
            const rideLength = 15 + Math.floor(Math.random() * 45); // 15-60 minute ride
            const completionTime = new Date(requestTime.getTime() + rideLength * 60 * 1000);
            const distance = 1 + Math.random() * 9; // 1-10 miles
            const fare = Math.round((12 + distance * 2.5 + rideLength * 0.5) * 100) / 100; // Base + distance + time
            
            additionalRides.push({
              customerId: customers[i % customers.length]._id,
              driverId: drivers[i % drivers.length]._id,
              pickup: {
                latitude: 37.7749 + (Math.random() * 0.05 - 0.025),
                longitude: -122.4194 + (Math.random() * 0.05 - 0.025),
                address: `${Math.floor(Math.random() * 1000) + 100} Sample St, San Francisco, CA`
              },
              dropoff: {
                latitude: 37.7749 + (Math.random() * 0.08 - 0.04),
                longitude: -122.4194 + (Math.random() * 0.08 - 0.04),
                address: `${Math.floor(Math.random() * 1000) + 100} Example Ave, San Francisco, CA`
              },
              status: 'completed',
              requestTime: requestTime,
              completionTime: completionTime,
              fare: fare,
              distance: distance,
              duration: rideLength,
              rating: Math.floor(Math.random() * 2) + 4 // 4-5 rating
            });
          }
          
          // Insert the additional rides
          try {
            const savedRides = await Ride.insertMany(additionalRides);
            console.log(`Created ${savedRides.length} additional sample rides with fare data`);
            
            // Recalculate revenue
            const allRides = await Ride.find({ status: 'completed' });
            totalRevenue = allRides.reduce((total, ride) => total + (ride.fare || 0), 0);
          } catch (rideError) {
            console.error('Error creating additional sample rides:', rideError);
          }
        }
      }
      
      // If still no revenue, use a fixed amount
      if (totalRevenue < 1000) {
        totalRevenue = 3500.25 + Math.random() * 500; // Sample revenue with some variation
      }
    }
    
    // Rides by status
    const requestedRides = await Ride.countDocuments({ status: 'requested' });
    const acceptedRides = await Ride.countDocuments({ status: 'accepted' });
    const inProgressRides = await Ride.countDocuments({ status: 'in_progress' });
    const cancelledRides = await Ride.countDocuments({ status: 'cancelled' });
    
    // Count active drivers and customers
    const activeDrivers = await Driver.countDocuments({ status: 'active' }) || driverCount;
    const activeCustomers = await Customer.countDocuments({ status: 'active' }) || customerCount;
    
    console.log('Sending statistics data to client. Revenue:', totalRevenue);
    
    res.json({
      success: true,
      data: {
        customerCount,
        driverCount,
        activeDrivers,
        activeCustomers,
        rideCount,
        completedRides,
        totalRevenue,
        ridesByStatus: {
          requested: requestedRides,
          accepted: acceptedRides,
          inProgress: inProgressRides,
          completed: completedRides,
          cancelled: cancelledRides
        },
        // Also include the fields expected by the frontend
        totalRides: rideCount,
        totalDrivers: driverCount,
        totalCustomers: customerCount,
        totalRevenue: totalRevenue
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

// Create new driver
app.post('/api/v1/admin/drivers', async (req, res) => {
  console.log('Received driver data:', JSON.stringify(req.body));
  try {
    // Check for existing driver with same email
    const existingDriver = await Driver.findOne({ email: req.body.email });
    if (existingDriver) {
      return res.status(400).json({ 
        success: false, 
        error: 'Driver with this email already exists' 
      });
    }
    
    // Create new driver
    const newDriver = new Driver({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      vehicle: req.body.vehicle || {
        make: 'Unknown',
        model: 'Unknown',
        year: new Date().getFullYear(),
        color: 'Unknown',
        licensePlate: 'Unknown'
      },
      // Normalize status value to match enum
      status: ['active', 'inactive', 'suspended'].includes(req.body.status) 
        ? req.body.status 
        : 'active',
      rating: 5.0,
      location: {
        latitude: 0,
        longitude: 0,
        lastUpdated: new Date()
      }
    });
    
    const savedDriver = await newDriver.save();
    console.log('Driver saved successfully:', savedDriver._id);
    
    return res.status(201).json({
      success: true,
      data: savedDriver
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while creating driver: ' + error.message
    });
  }
});

// Update driver
app.put('/api/v1/admin/drivers/:id', async (req, res) => {
  console.log('Updating driver:', req.params.id, JSON.stringify(req.body));
  try {
    const driverId = req.params.id;
    
    // Check if driver exists
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }
    
    // Update driver fields
    const updateData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      // Normalize status value
      status: ['active', 'inactive', 'suspended'].includes(req.body.status) 
        ? req.body.status 
        : driver.status
    };
    
    // Update vehicle if provided
    if (req.body.vehicle) {
      updateData.vehicle = req.body.vehicle;
    }
    
    // Find and update driver
    const updatedDriver = await Driver.findByIdAndUpdate(
      driverId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    console.log('Driver updated successfully');
    
    return res.status(200).json({
      success: true,
      data: updatedDriver
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while updating driver: ' + error.message
    });
  }
});

// Create billing schema
const billingSchema = new mongoose.Schema({
  _id: { type: String, required: false }, // Custom ID like "bill123"
  rideId: { type: String, required: true },
  customerId: { type: String, required: true },
  driverId: { type: String, required: true },
  date: { type: Date, default: Date.now },
  pickupTime: { type: Date },
  dropoffTime: { type: Date },
  distanceCovered: { type: Number },
  sourceLocation: { type: Object },
  destinationLocation: { type: Object },
  predictedAmount: { type: Number },
  actualAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Paid' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create Billing model
const Billing = mongoose.model('Billing', billingSchema);

// Create sample billing data
async function createSampleBillingData() {
  try {
    const billingCount = await Billing.countDocuments();
    console.log(`Current billing count: ${billingCount}`);
    
    if (billingCount === 0) {
      // Find all completed rides
      const rides = await Ride.find({ status: 'completed' });
      console.log(`Found ${rides.length} completed rides to create billing data for`);
      
      if (rides.length > 0) {
        const billingData = rides.map(ride => ({
          _id: `bill${Math.floor(Math.random() * 1000)}`,
          rideId: `ride${Math.floor(Math.random() * 1000)}`,
          customerId: ride.customerId ? ride.customerId.toString() : '987-65-4321',
          driverId: ride.driverId ? ride.driverId.toString() : '123-45-6789',
          date: new Date(),
          pickupTime: ride.requestTime || new Date(),
          dropoffTime: ride.completionTime || new Date(Date.now() + 3600000),
          distanceCovered: ride.distance || Math.random() * 10 + 1,
          sourceLocation: {
            latitude: ride.pickup ? ride.pickup.latitude : 37.7749,
            longitude: ride.pickup ? ride.pickup.longitude : -122.4194,
            address: ride.pickup ? ride.pickup.address : '123 Main St, San Francisco, CA'
          },
          destinationLocation: {
            latitude: ride.dropoff ? ride.dropoff.latitude : 37.7833,
            longitude: ride.dropoff ? ride.dropoff.longitude : -122.4167,
            address: ride.dropoff ? ride.dropoff.address : '456 Market St, San Francisco, CA'
          },
          predictedAmount: ride.fare ? ride.fare * 0.9 : 20.5,
          actualAmount: ride.fare || 22,
          paymentStatus: 'Paid',
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        const savedBills = await Billing.insertMany(billingData);
        console.log(`Sample billing data created: ${savedBills.length} records`);
      } else {
        // If no completed rides, create sample bills with hardcoded data
        console.log('No completed rides found, creating sample billing data with mock data');
        
        const mockBillingData = [
          {
            _id: 'bill123',
            rideId: 'ride123',
            customerId: '987-65-4321',
            driverId: '123-45-6789',
            date: new Date(),
            pickupTime: new Date(),
            dropoffTime: new Date(Date.now() + 3600000),
            distanceCovered: 5.2,
            sourceLocation: {
              latitude: 37.7749,
              longitude: -122.4194,
              address: '123 Main St, San Francisco, CA'
            },
            destinationLocation: {
              latitude: 37.7833,
              longitude: -122.4167,
              address: '456 Market St, San Francisco, CA'
            },
            predictedAmount: 20.5,
            actualAmount: 22,
            paymentStatus: 'Paid',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            _id: 'bill124',
            rideId: 'ride124',
            customerId: '987-65-4322',
            driverId: '123-45-6790',
            date: new Date(Date.now() - 86400000),
            pickupTime: new Date(Date.now() - 86400000),
            dropoffTime: new Date(Date.now() - 86400000 + 1800000),
            distanceCovered: 3.8,
            sourceLocation: {
              latitude: 37.7833,
              longitude: -122.4167,
              address: '789 Howard St, San Francisco, CA'
            },
            destinationLocation: {
              latitude: 37.7749,
              longitude: -122.4194,
              address: '101 Van Ness Ave, San Francisco, CA'
            },
            predictedAmount: 15.5,
            actualAmount: 18.75,
            paymentStatus: 'Paid',
            createdAt: new Date(Date.now() - 86400000),
            updatedAt: new Date(Date.now() - 86400000)
          }
        ];
        
        const savedMockBills = await Billing.insertMany(mockBillingData);
        console.log(`Sample mock billing data created: ${savedMockBills.length} records`);
      }
    }
  } catch (error) {
    console.error('Error creating sample billing data:', error);
  }
}

// Call the function to create sample billing data
createSampleBillingData();

// Billing endpoints
app.get('/api/v1/admin/bills', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    
    console.log(`Fetching bills: page=${page}, limit=${limit}, search=${search}`);
    
    let query = {};
    
    // Add search functionality if search term is provided
    if (search) {
      // Match against common searchable fields
      query = {
        $or: [
          { _id: { $regex: search, $options: 'i' } },
          { rideId: { $regex: search, $options: 'i' } },
          { customerId: { $regex: search, $options: 'i' } },
          { driverId: { $regex: search, $options: 'i' } }
        ]
      };
      console.log('Search query provided:', search);
    }
    
    // Execute the query with pagination
    const bills = await Billing.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Billing.countDocuments(query);
    
    console.log(`Found ${bills.length} bills, total: ${total}`);
    
    // If no bills found, create sample data if needed
    if (bills.length === 0 && total === 0) {
      await createSampleBillingData();
      
      // Try fetching again
      const newBills = await Billing.find()
        .sort({ createdAt: -1 })
        .limit(limit);
      
      if (newBills.length > 0) {
        console.log(`Created and fetched ${newBills.length} sample bills`);
        return res.json({
          success: true,
          data: newBills,
          pagination: {
            total: newBills.length,
            page,
            pages: Math.ceil(newBills.length / limit)
          }
        });
      }
    }
    
    res.json({
      success: true,
      data: bills,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bills' });
  }
});

app.get('/api/v1/admin/bills/:id', async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id);
    
    if (!bill) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    
    res.json({ success: true, data: bill });
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bill' });
  }
});

// Create new customer
app.post('/api/v1/admin/customers', async (req, res) => {
  console.log('Received customer data:', JSON.stringify(req.body));
  try {
    // Check for existing customer with same email
    const existingCustomer = await Customer.findOne({ email: req.body.email });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: 'Customer with this email already exists'
      });
    }
    
    // Create new customer
    const newCustomer = new Customer({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      status: ['active', 'inactive', 'suspended'].includes(req.body.status)
        ? req.body.status
        : 'active',
      registrationDate: new Date()
    });
    
    const savedCustomer = await newCustomer.save();
    console.log('Customer saved successfully:', savedCustomer._id);
    
    return res.status(201).json({
      success: true,
      data: savedCustomer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while creating customer: ' + error.message
    });
  }
});

// Update customer
app.put('/api/v1/admin/customers/:id', async (req, res) => {
  console.log('Updating customer:', req.params.id, JSON.stringify(req.body));
  try {
    const customerId = req.params.id;
    
    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    
    // Update customer fields
    const updateData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      // Normalize status value
      status: ['active', 'inactive', 'suspended'].includes(req.body.status)
        ? req.body.status
        : customer.status
    };
    
    // Find and update customer
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    console.log('Customer updated successfully');
    
    return res.status(200).json({
      success: true,
      data: updatedCustomer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while updating customer: ' + error.message
    });
  }
});

// Reviews endpoints
app.get('/api/v1/admin/reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Review.countDocuments();
    
    res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
});

app.get('/api/v1/admin/drivers/:id/reviews', async (req, res) => {
  try {
    const driverId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find({ 
      revieweeId: driverId,
      revieweeType: 'driver'
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Review.countDocuments({ 
      revieweeId: driverId,
      revieweeType: 'driver'
    });
    
    res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching driver reviews:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch driver reviews' });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Enhanced mock server running on http://localhost:${PORT}`);
  console.log('Use admin@uber.com/admin123 to log in');
}); 