const dotenv = require('dotenv');
dotenv.config(); // ✅ Make sure this is FIRST

const express = require('express');
const mongoose = require('mongoose');
const driverRoutes = require('./routes/driver.routes');
const customerRoutes = require('./routes/customer.routes');
const billRoutes = require('./routes/billing.routes');
const statisticsRoutes = require('./routes/statistics.routes');
const chartRoutes = require('./routes/chart.routes');
const connectDB = require('./config/db');

const rateLimit = require('express-rate-limit');
const statisticsRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many requests, please try again later.'
});

connectDB(); 

const app = express();
app.use(express.json());

app.use('/api/v1/admin/drivers', driverRoutes);
app.use('/api/v1/admin/customers', customerRoutes);
app.use('/api/v1/admin/bills', billRoutes);
app.use('/api/v1/admin/statistics', statisticsRateLimiter, statisticsRoutes);
app.use('/api/v1/admin/charts', chartRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
