"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDriver = addDriver;
exports.addCustomer = addCustomer;
exports.getDriver = getDriver;
exports.getCustomer = getCustomer;
exports.getStatistics = getStatistics;
exports.getChartData = getChartData;
exports.searchBills = searchBills;
exports.getBill = getBill;
const producer_1 = require("../../kafka/producer");
const axios_1 = __importDefault(require("axios"));
// Utility: Validate SSN format
function isValidSSN(ssn) {
    return /^\d{3}-\d{2}-\d{4}$/.test(ssn);
}
// Add Driver (produces to signup_requests topic)
async function addDriver(req, res) {
    const { driverId, firstName, lastName, email, ...rest } = req.body;
    if (!driverId || !isValidSSN(driverId) || !firstName || !lastName || !email) {
        return res.status(400).json({ error: 'Invalid input', message: 'Missing or invalid fields' });
    }
    try {
        const producer = await (0, producer_1.getKafkaProducer)();
        await producer.send({
            topic: producer_1.TOPICS.SIGNUP_REQUESTS,
            messages: [
                {
                    key: driverId,
                    value: JSON.stringify({
                        role: 'driver',
                        driverId,
                        firstName,
                        lastName,
                        email,
                        ...rest,
                    }),
                },
            ],
        });
        return res.status(202).json({ message: 'Driver creation requested' });
    }
    catch (err) {
        return res.status(500).json({ error: 'Kafka error', message: err.message });
    }
}
// Add Customer (produces to signup_requests topic)
async function addCustomer(req, res) {
    const { customerId, firstName, lastName, email, ...rest } = req.body;
    if (!customerId || !isValidSSN(customerId) || !firstName || !lastName || !email) {
        return res.status(400).json({ error: 'Invalid input', message: 'Missing or invalid fields' });
    }
    try {
        const producer = await (0, producer_1.getKafkaProducer)();
        await producer.send({
            topic: producer_1.TOPICS.SIGNUP_REQUESTS,
            messages: [
                {
                    key: customerId,
                    value: JSON.stringify({
                        role: 'customer',
                        customerId,
                        firstName,
                        lastName,
                        email,
                        ...rest,
                    }),
                },
            ],
        });
        return res.status(202).json({ message: 'Customer creation requested' });
    }
    catch (err) {
        return res.status(500).json({ error: 'Kafka error', message: err.message });
    }
}
// Get Driver by ID (calls Driver Service)
async function getDriver(req, res) {
    const { driverId } = req.params;
    if (!isValidSSN(driverId)) {
        return res.status(400).json({ error: 'Invalid driverId format' });
    }
    try {
        const response = await axios_1.default.get(`${process.env.DRIVER_SERVICE_URL}/drivers/${driverId}`, {
            headers: { Authorization: req.headers.authorization || '' },
        });
        return res.status(200).json(response.data);
    }
    catch (err) {
        return res.status(err.response?.status || 500).json({ error: err.message });
    }
}
// Get Customer by ID (calls Customer Service)
async function getCustomer(req, res) {
    const { customerId } = req.params;
    if (!isValidSSN(customerId)) {
        return res.status(400).json({ error: 'Invalid customerId format' });
    }
    try {
        const response = await axios_1.default.get(`${process.env.CUSTOMER_SERVICE_URL}/customers/${customerId}`, {
            headers: { Authorization: req.headers.authorization || '' },
        });
        return res.status(200).json(response.data);
    }
    catch (err) {
        return res.status(err.response?.status || 500).json({ error: err.message });
    }
}
// Get system statistics (calls multiple services or a reporting service)
async function getStatistics(req, res) {
    try {
        // Example: aggregate from multiple services
        const [drivers, customers, rides, bills] = await Promise.all([
            axios_1.default.get(`${process.env.DRIVER_SERVICE_URL}/drivers/count`),
            axios_1.default.get(`${process.env.CUSTOMER_SERVICE_URL}/customers/count`),
            axios_1.default.get(`${process.env.RIDES_SERVICE_URL}/rides/count`),
            axios_1.default.get(`${process.env.BILLING_SERVICE_URL}/bills/count`),
        ]);
        return res.status(200).json({
            drivers: drivers.data.count,
            customers: customers.data.count,
            rides: rides.data.count,
            bills: bills.data.count,
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch statistics', message: err.message });
    }
}
// Get chart data (calls reporting/analytics service)
async function getChartData(req, res) {
    try {
        const response = await axios_1.default.get(`${process.env.REPORTING_SERVICE_URL}/charts`, {
            params: req.query,
        });
        return res.status(200).json(response.data);
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch chart data', message: err.message });
    }
}
// Search bills (calls Billing Service)
async function searchBills(req, res) {
    try {
        const response = await axios_1.default.get(`${process.env.BILLING_SERVICE_URL}/bills`, {
            params: req.query,
            headers: { Authorization: req.headers.authorization || '' },
        });
        return res.status(200).json(response.data);
    }
    catch (err) {
        return res.status(err.response?.status || 500).json({ error: err.message });
    }
}
// Get bill by ID (calls Billing Service)
async function getBill(req, res) {
    const { billingId } = req.params;
    if (!isValidSSN(billingId)) {
        return res.status(400).json({ error: 'Invalid billingId format' });
    }
    try {
        const response = await axios_1.default.get(`${process.env.BILLING_SERVICE_URL}/bills/${billingId}`, {
            headers: { Authorization: req.headers.authorization || '' },
        });
        return res.status(200).json(response.data);
    }
    catch (err) {
        return res.status(err.response?.status || 500).json({ error: err.message });
    }
}
