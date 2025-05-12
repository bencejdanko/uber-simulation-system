require('dotenv').config();
const mongoose = require('mongoose');
const { Customer, Driver, Ride, Bill } = require('../models');

// MongoDB connection
const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uber-simulation';
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
    
    // Drop all collections
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.drop();
      console.log(`Dropped collection: ${collection.collectionName}`);
    }
    console.log('All collections dropped');
    
  } catch (error) {
    // If the error is about dropping system collections or collections that don't exist, ignore it
    if (error.code !== 26 && error.codeName !== 'NamespaceNotFound') {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  }
};

// Initial data
const initialCustomers = [
  { 
    firstName: 'John', 
    lastName: 'Doe', 
    email: 'john.doe@example.com', 
    phone: '+1234567890', 
    ridesCount: 28, 
    totalSpent: 845.50, 
    status: 'ACTIVE' 
  },
  { 
    firstName: 'Jane', 
    lastName: 'Smith', 
    email: 'jane.smith@example.com', 
    phone: '+1987654321', 
    ridesCount: 35, 
    totalSpent: 1120.25, 
    status: 'ACTIVE' 
  },
  { 
    firstName: 'Robert', 
    lastName: 'Brown', 
    email: 'robert.brown@example.com', 
    phone: '+1122334455', 
    ridesCount: 15, 
    totalSpent: 456.80, 
    status: 'INACTIVE' 
  },
  { 
    firstName: 'Emily', 
    lastName: 'Wilson', 
    email: 'emily.wilson@example.com', 
    phone: '+1443322110', 
    ridesCount: 42, 
    totalSpent: 1356.70, 
    status: 'ACTIVE' 
  },
  { 
    firstName: 'Michael', 
    lastName: 'Lee', 
    email: 'michael.lee@example.com', 
    phone: '+1778899001', 
    ridesCount: 22, 
    totalSpent: 678.40, 
    status: 'ACTIVE' 
  }
];

const initialDrivers = [
  { 
    firstName: 'Mark', 
    lastName: 'Wilson', 
    email: 'mark.wilson@example.com', 
    phone: '+1554433221', 
    carDetails: 'Toyota Camry, 2020', 
    rating: 4.8, 
    ridesCount: 152, 
    status: 'ACTIVE' 
  },
  { 
    firstName: 'Sarah', 
    lastName: 'Johnson', 
    email: 'sarah.johnson@example.com', 
    phone: '+1987654321', 
    carDetails: 'Honda Civic, 2019', 
    rating: 4.7, 
    ridesCount: 98, 
    status: 'ACTIVE' 
  },
  { 
    firstName: 'James', 
    lastName: 'Davis', 
    email: 'james.davis@example.com', 
    phone: '+1456789012', 
    carDetails: 'Ford Focus, 2021', 
    rating: 4.5, 
    ridesCount: 65, 
    status: 'ACTIVE' 
  },
  { 
    firstName: 'Tom', 
    lastName: 'Garcia', 
    email: 'tom.garcia@example.com', 
    phone: '+1765432198', 
    carDetails: 'Chevrolet Malibu, 2020', 
    rating: 4.9, 
    ridesCount: 112, 
    status: 'ACTIVE' 
  },
  { 
    firstName: 'David', 
    lastName: 'Clark', 
    email: 'david.clark@example.com', 
    phone: '+1654321987', 
    carDetails: 'Nissan Sentra, 2021', 
    rating: 4.6, 
    ridesCount: 87, 
    status: 'ACTIVE' 
  }
];

// Seed database
const seedDB = async () => {
  try {
    // Connect to MongoDB and drop all collections
    await connectDB();
    
    // Insert customers
    console.log('Inserting customers...');
    const customers = await Customer.insertMany(initialCustomers);
    
    // Insert drivers
    console.log('Inserting drivers...');
    const drivers = await Driver.insertMany(initialDrivers);
    
    // Create rides
    console.log('Creating rides...');
    const rides = [
      {
        customerId: customers[0]._id,
        driverId: drivers[0]._id,
        customerName: `${customers[0].firstName} ${customers[0].lastName}`,
        driverName: `${drivers[0].firstName} ${drivers[0].lastName}`,
        requestTime: new Date('2023-05-10T09:30:00Z'),
        pickupTime: new Date('2023-05-10T09:35:00Z'),
        dropoffTime: new Date('2023-05-10T10:05:00Z'),
        pickup: '123 Main St, New York, NY',
        destination: 'JFK Airport, Queens, NY',
        status: 'COMPLETED',
        fare: 35.75,
        distanceKm: 22.5,
        durationMinutes: 30,
        paymentMethod: 'CREDIT_CARD'
      },
      {
        customerId: customers[1]._id,
        driverId: drivers[1]._id,
        customerName: `${customers[1].firstName} ${customers[1].lastName}`,
        driverName: `${drivers[1].firstName} ${drivers[1].lastName}`,
        requestTime: new Date('2023-05-10T14:15:00Z'),
        pickupTime: new Date('2023-05-10T14:22:00Z'),
        dropoffTime: new Date('2023-05-10T14:45:00Z'),
        pickup: 'Central Mall, Los Angeles, CA',
        destination: '456 Oak St, Los Angeles, CA',
        status: 'COMPLETED',
        fare: 22.50,
        distanceKm: 8.3,
        durationMinutes: 23,
        paymentMethod: 'WALLET'
      },
      {
        customerId: customers[2]._id,
        driverId: drivers[2]._id,
        customerName: `${customers[2].firstName} ${customers[2].lastName}`,
        driverName: `${drivers[2].firstName} ${drivers[2].lastName}`,
        requestTime: new Date('2023-05-11T11:45:00Z'),
        pickupTime: new Date('2023-05-11T11:50:00Z'),
        dropoffTime: new Date('2023-05-11T12:30:00Z'),
        pickup: 'Tech Park, Chicago, IL',
        destination: 'Willow Heights, Chicago, IL',
        status: 'COMPLETED',
        fare: 45.20,
        distanceKm: 18.7,
        durationMinutes: 40,
        paymentMethod: 'CREDIT_CARD'
      },
      {
        customerId: customers[3]._id,
        driverId: drivers[3]._id,
        customerName: `${customers[3].firstName} ${customers[3].lastName}`,
        driverName: `${drivers[3].firstName} ${drivers[3].lastName}`,
        requestTime: new Date('2023-05-11T16:30:00Z'),
        pickupTime: new Date('2023-05-11T16:38:00Z'),
        dropoffTime: new Date('2023-05-11T16:55:00Z'),
        pickup: 'State University, Houston, TX',
        destination: 'Downtown Plaza, Houston, TX',
        status: 'COMPLETED',
        fare: 18.30,
        distanceKm: 6.2,
        durationMinutes: 17,
        paymentMethod: 'CASH'
      },
      {
        customerId: customers[4]._id,
        driverId: drivers[4]._id,
        customerName: `${customers[4].firstName} ${customers[4].lastName}`,
        driverName: `${drivers[4].firstName} ${drivers[4].lastName}`,
        requestTime: new Date('2023-05-12T19:00:00Z'),
        pickupTime: new Date('2023-05-12T19:08:00Z'),
        dropoffTime: new Date('2023-05-12T19:35:00Z'),
        pickup: 'Grand Hotel, Phoenix, AZ',
        destination: 'Restaurant Row, Phoenix, AZ',
        status: 'COMPLETED',
        fare: 28.90,
        distanceKm: 10.5,
        durationMinutes: 27,
        paymentMethod: 'CREDIT_CARD'
      },
      {
        customerId: customers[1]._id,
        driverId: drivers[0]._id,
        customerName: `${customers[1].firstName} ${customers[1].lastName}`,
        driverName: `${drivers[0].firstName} ${drivers[0].lastName}`,
        requestTime: new Date('2023-05-13T08:45:00Z'),
        pickup: '123 Pine St, Philadelphia, PA',
        destination: 'Philadelphia Airport, PA',
        status: 'CANCELLED',
        cancellationReason: 'Customer cancelled'
      },
      {
        customerId: customers[0]._id,
        driverId: drivers[2]._id,
        customerName: `${customers[0].firstName} ${customers[0].lastName}`,
        driverName: `${drivers[2].firstName} ${drivers[2].lastName}`,
        requestTime: new Date('2023-05-13T12:15:00Z'),
        pickupTime: new Date('2023-05-13T12:22:00Z'),
        pickup: 'Central Park, New York, NY',
        destination: 'Broadway Theater, New York, NY',
        status: 'IN_PROGRESS',
        distanceKm: 3.5,
        estimatedFare: 15.50,
        estimatedDuration: 15
      },
      {
        customerId: customers[3]._id,
        customerName: `${customers[3].firstName} ${customers[3].lastName}`,
        requestTime: new Date('2023-05-14T10:00:00Z'),
        pickup: 'Home Address, Houston, TX',
        destination: 'Shopping Mall, Houston, TX',
        status: 'SCHEDULED',
        estimatedFare: 22.75,
        estimatedDistance: 9.8,
        scheduledTime: new Date('2023-05-16T14:30:00Z')
      }
    ];

    const createdRides = await Ride.insertMany(rides);
    
    // Create bills for completed rides
    console.log('Creating bills...');
    const bills = [];
    for (const ride of createdRides) {
      if (ride.status === 'COMPLETED') {
        bills.push({
          rideId: ride._id,
          date: ride.dropoffTime,
          amount: ride.fare,
          customer: ride.customerName,
          customerId: ride.customerId,
          driver: ride.driverName,
          driverId: ride.driverId,
          source: ride.pickup,
          destination: ride.destination,
          paymentMethod: ride.paymentMethod,
          paymentStatus: 'COMPLETED'
        });
      }
    }
    
    await Bill.insertMany(bills);
    
    console.log('Database seed completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed function
seedDB(); 