/**
 * Mock Data Generator for Admin Dashboard
 * 
 * This script generates and seeds mock data for testing the admin dashboard
 * while actual services are being developed.
 */

const mongoose = require('mongoose');
const Driver = require('./models/driver.model');
const Customer = require('./models/customer.model');
const Ride = require('./models/ride.model');
const Bill = require('./models/bill.model');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/uber_simulation')
  .then(() => console.log('MongoDB connected for mock data generation'))
  .catch(err => console.error('MongoDB connection error:', err));

// Helper to generate random SSN format ID
const generateSsnId = () => {
  const part1 = String(Math.floor(Math.random() * 900) + 100);
  const part2 = String(Math.floor(Math.random() * 90) + 10);
  const part3 = String(Math.floor(Math.random() * 9000) + 1000);
  return `${part1}-${part2}-${part3}`;
};

// Helper to generate random phone number
const generatePhone = () => {
  return `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
};

// Helper to get random item from array
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// List of cities for data generation
const cities = [
  { name: 'New York', state: 'NY', zip: '10001', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles', state: 'CA', zip: '90001', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago', state: 'IL', zip: '60601', lat: 41.8781, lng: -87.6298 },
  { name: 'Houston', state: 'TX', zip: '77001', lat: 29.7604, lng: -95.3698 },
  { name: 'Phoenix', state: 'AZ', zip: '85001', lat: 33.4484, lng: -112.0740 },
  { name: 'Philadelphia', state: 'PA', zip: '19019', lat: 39.9526, lng: -75.1652 }
];

// List of car makes and models
const cars = [
  { make: 'Toyota', models: ['Camry', 'Corolla', 'Prius', 'RAV4'] },
  { make: 'Honda', models: ['Civic', 'Accord', 'CR-V', 'Pilot'] },
  { make: 'Ford', models: ['Focus', 'Fusion', 'Escape', 'Explorer'] },
  { make: 'Chevrolet', models: ['Malibu', 'Cruze', 'Equinox', 'Tahoe'] },
  { make: 'Nissan', models: ['Altima', 'Sentra', 'Rogue', 'Pathfinder'] }
];

// List of colors
const colors = ['Black', 'White', 'Silver', 'Blue', 'Red', 'Gray'];

// List of street names
const streets = [
  'Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Washington Ave',
  'Park Blvd', 'Lake Dr', 'River Rd', 'Mountain View', 'Sunset Dr', 'Broadway'
];

// List of payment methods
const paymentMethods = ['credit_card', 'cash', 'wallet'];

// Generate a random driver
const generateDriver = async () => {
  const id = generateSsnId();
  const city = getRandomItem(cities);
  const car = getRandomItem(cars);
  const firstName = `Driver${Math.floor(Math.random() * 1000)}`;
  const lastName = `User${Math.floor(Math.random() * 1000)}`;
  
  return {
    _id: id,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    phone: generatePhone(),
    address: `${Math.floor(Math.random() * 9000) + 1000} ${getRandomItem(streets)}`,
    city: city.name,
    state: city.state,
    zipCode: city.zip,
    carDetails: {
      make: car.make,
      model: getRandomItem(car.models),
      year: Math.floor(Math.random() * 10) + 2013,
      color: getRandomItem(colors),
      licensePlate: `${getRandomItem(colors).substr(0, 1)}${Math.floor(Math.random() * 900) + 100}${getRandomItem(['ABC', 'XYZ', 'JKL', 'MNO']).toUpperCase()}`
    },
    rating: parseFloat((Math.random() * 3 + 2).toFixed(1)),
    status: getRandomItem(['active', 'active', 'active', 'inactive', 'pending']),
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
  };
};

// Generate a random customer
const generateCustomer = async () => {
  const id = generateSsnId();
  const city = getRandomItem(cities);
  const firstName = `Customer${Math.floor(Math.random() * 1000)}`;
  const lastName = `User${Math.floor(Math.random() * 1000)}`;
  
  return {
    _id: id,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    phone: generatePhone(),
    address: `${Math.floor(Math.random() * 9000) + 1000} ${getRandomItem(streets)}`,
    city: city.name,
    state: city.state,
    zipCode: city.zip,
    creditCards: [{
      cardNumber: `************${Math.floor(Math.random() * 9000) + 1000}`,
      cardholderName: `${firstName} ${lastName}`,
      expirationMonth: Math.floor(Math.random() * 12) + 1,
      expirationYear: Math.floor(Math.random() * 5) + 2024,
      brand: getRandomItem(['visa', 'mastercard', 'amex', 'discover']),
      isDefault: true
    }],
    rating: parseFloat((Math.random() * 3 + 2).toFixed(1)),
    status: getRandomItem(['active', 'active', 'active', 'inactive']),
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
  };
};

// Generate a random ride
const generateRide = async (customerId, driverId) => {
  const id = generateSsnId();
  const pickupCity = getRandomItem(cities);
  const dropoffCity = getRandomItem(cities);
  const requestTime = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
  
  // Add random minutes for pickup (5-15 mins after request)
  const pickupTime = new Date(requestTime);
  pickupTime.setMinutes(pickupTime.getMinutes() + Math.floor(Math.random() * 10) + 5);
  
  // Add random ride duration (10-60 mins)
  const duration = Math.floor(Math.random() * 50) + 10;
  const dropoffTime = new Date(pickupTime);
  dropoffTime.setMinutes(dropoffTime.getMinutes() + duration);
  
  // Calculate distance (roughly based on 30mph average speed)
  const distance = parseFloat(((duration / 60) * 30 * (Math.random() * 0.5 + 0.75)).toFixed(1));
  
  const status = getRandomItem(['completed', 'completed', 'completed', 'cancelled', 'in_progress']);
  const estimatedFare = parseFloat((2.5 + (distance * 1.5) + (duration * 0.2)).toFixed(2));
  const finalFare = status === 'completed' ? estimatedFare : 0;
  
  return {
    _id: id,
    customerId,
    driverId,
    pickup: {
      address: `${Math.floor(Math.random() * 9000) + 1000} ${getRandomItem(streets)}`,
      latitude: pickupCity.lat + (Math.random() * 0.2 - 0.1),
      longitude: pickupCity.lng + (Math.random() * 0.2 - 0.1),
      city: pickupCity.name,
      state: pickupCity.state,
      zipCode: pickupCity.zip
    },
    dropoff: {
      address: `${Math.floor(Math.random() * 9000) + 1000} ${getRandomItem(streets)}`,
      latitude: dropoffCity.lat + (Math.random() * 0.2 - 0.1),
      longitude: dropoffCity.lng + (Math.random() * 0.2 - 0.1),
      city: dropoffCity.name,
      state: dropoffCity.state,
      zipCode: dropoffCity.zip
    },
    requestTime,
    pickupTime: status !== 'cancelled' ? pickupTime : null,
    dropoffTime: status === 'completed' ? dropoffTime : null,
    status,
    distance,
    duration,
    estimatedFare,
    finalFare,
    paymentStatus: status === 'completed' ? 'completed' : 'pending',
    cancelledBy: status === 'cancelled' ? getRandomItem(['customer', 'driver', 'system']) : null,
    cancellationReason: status === 'cancelled' ? 'Customer/driver cancelled the ride' : null,
    date: requestTime
  };
};

// Generate a bill for a completed ride
const generateBill = async (ride) => {
  if (ride.status !== 'completed') return null;
  
  const baseFare = 2.5;
  const distanceFare = parseFloat((ride.distance * 1.5).toFixed(2));
  const timeFare = parseFloat((ride.duration * 0.2).toFixed(2));
  const surge = Math.random() > 0.7 ? parseFloat((Math.random() * 0.5 + 1.1).toFixed(1)) : 1.0;
  const subtotal = (baseFare + distanceFare + timeFare) * surge;
  const tax = parseFloat((subtotal * 0.0825).toFixed(2));
  const tip = Math.random() > 0.3 ? parseFloat((subtotal * (Math.random() * 0.2 + 0.1)).toFixed(2)) : 0;
  const amount = parseFloat((subtotal + tax + tip).toFixed(2));
  
  return {
    rideId: ride._id,
    customerId: ride.customerId,
    driverId: ride.driverId,
    date: ride.dropoffTime,
    pickupTime: ride.pickupTime,
    dropoffTime: ride.dropoffTime,
    distance: ride.distance,
    duration: ride.duration,
    baseFare,
    distanceFare,
    timeFare,
    surge,
    tax,
    tip,
    amount,
    status: 'paid',
    paymentMethod: getRandomItem(paymentMethods),
    source: `${ride.pickup.city}, ${ride.pickup.state}`,
    destination: `${ride.dropoff.city}, ${ride.dropoff.state}`
  };
};

// Generate all the data
const generateData = async (driverCount = 20, customerCount = 50, ridesPerCustomer = 3) => {
  try {
    // Clear existing data
    await Driver.deleteMany({});
    await Customer.deleteMany({});
    await Ride.deleteMany({});
    await Bill.deleteMany({});
    
    console.log('Generating drivers...');
    const drivers = [];
    for (let i = 0; i < driverCount; i++) {
      const driver = await generateDriver();
      drivers.push(driver);
      await Driver.create(driver);
    }
    
    console.log('Generating customers...');
    const customers = [];
    for (let i = 0; i < customerCount; i++) {
      const customer = await generateCustomer();
      customers.push(customer);
      await Customer.create(customer);
    }
    
    console.log('Generating rides and bills...');
    let billCount = 0;
    for (const customer of customers) {
      const numRides = Math.floor(Math.random() * ridesPerCustomer) + 1;
      for (let i = 0; i < numRides; i++) {
        const randomDriver = getRandomItem(drivers);
        const ride = await generateRide(customer._id, randomDriver._id);
        await Ride.create(ride);
        
        if (ride.status === 'completed') {
          const bill = await generateBill(ride);
          if (bill) {
            await Bill.create(bill);
            billCount++;
          }
        }
      }
    }
    
    console.log(`Data generation complete: ${drivers.length} drivers, ${customers.length} customers, ${ridesPerCustomer * customers.length} rides, ${billCount} bills`);
    
  } catch (error) {
    console.error('Error generating data:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Run the data generation
const driverCount = 50;
const customerCount = 100;
const ridesPerCustomer = 5;

console.log(`Starting mock data generation: ${driverCount} drivers, ${customerCount} customers, ~${ridesPerCustomer} rides per customer`);
generateData(driverCount, customerCount, ridesPerCustomer); 