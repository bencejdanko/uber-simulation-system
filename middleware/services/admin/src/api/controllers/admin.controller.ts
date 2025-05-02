import { Request, Response } from 'express';
import { getKafkaProducer, TOPICS } from '../../kafka/producer';
import axios from 'axios';

// Utility: Validate SSN format
function isValidSSN(ssn: string) {
  return /^\d{3}-\d{2}-\d{4}$/.test(ssn);
}

// Add Driver (produces to signup_requests topic)
export async function addDriver(req: Request, res: Response) {
  const { driverId, firstName, lastName, email, ...rest } = req.body;
  if (!driverId || !isValidSSN(driverId) || !firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Invalid input', message: 'Missing or invalid fields' });
  }
  try {
    const producer = await getKafkaProducer();
    await producer.send({
      topic: TOPICS.SIGNUP_REQUESTS,
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
  } catch (err) {
    return res.status(500).json({ error: 'Kafka error', message: (err as Error).message });
  }
}

// Add Customer (produces to signup_requests topic)
export async function addCustomer(req: Request, res: Response) {
  const { customerId, firstName, lastName, email, ...rest } = req.body;
  if (!customerId || !isValidSSN(customerId) || !firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Invalid input', message: 'Missing or invalid fields' });
  }
  try {
    const producer = await getKafkaProducer();
    await producer.send({
      topic: TOPICS.SIGNUP_REQUESTS,
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
  } catch (err) {
    return res.status(500).json({ error: 'Kafka error', message: (err as Error).message });
  }
}

// Get Driver by ID (calls Driver Service)
export async function getDriver(req: Request, res: Response) {
  const { driverId } = req.params;
  if (!isValidSSN(driverId)) {
    return res.status(400).json({ error: 'Invalid driverId format' });
  }
  try {
    const response = await axios.get(`${process.env.DRIVER_SERVICE_URL}/drivers/${driverId}`, {
      headers: { Authorization: req.headers.authorization || '' },
    });
    return res.status(200).json(response.data);
  } catch (err: any) {
    return res.status(err.response?.status || 500).json({ error: err.message });
  }
}

// Get Customer by ID (calls Customer Service)
export async function getCustomer(req: Request, res: Response) {
  const { customerId } = req.params;
  if (!isValidSSN(customerId)) {
    return res.status(400).json({ error: 'Invalid customerId format' });
  }
  try {
    const response = await axios.get(`${process.env.CUSTOMER_SERVICE_URL}/customers/${customerId}`, {
      headers: { Authorization: req.headers.authorization || '' },
    });
    return res.status(200).json(response.data);
  } catch (err: any) {
    return res.status(err.response?.status || 500).json({ error: err.message });
  }
}

// Get system statistics (calls multiple services or a reporting service)
export async function getStatistics(req: Request, res: Response) {
  try {
    // Example: aggregate from multiple services
    const [drivers, customers, rides, bills] = await Promise.all([
      axios.get(`${process.env.DRIVER_SERVICE_URL}/drivers/count`),
      axios.get(`${process.env.CUSTOMER_SERVICE_URL}/customers/count`),
      axios.get(`${process.env.RIDES_SERVICE_URL}/rides/count`),
      axios.get(`${process.env.BILLING_SERVICE_URL}/bills/count`),
    ]);
    return res.status(200).json({
      drivers: drivers.data.count,
      customers: customers.data.count,
      rides: rides.data.count,
      bills: bills.data.count,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch statistics', message: err.message });
  }
}

// Get chart data (calls reporting/analytics service)
export async function getChartData(req: Request, res: Response) {
  try {
    const response = await axios.get(`${process.env.REPORTING_SERVICE_URL}/charts`, {
      params: req.query,
    });
    return res.status(200).json(response.data);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch chart data', message: err.message });
  }
}

// Search bills (calls Billing Service)
export async function searchBills(req: Request, res: Response) {
  try {
    const response = await axios.get(`${process.env.BILLING_SERVICE_URL}/bills`, {
      params: req.query,
      headers: { Authorization: req.headers.authorization || '' },
    });
    return res.status(200).json(response.data);
  } catch (err: any) {
    return res.status(err.response?.status || 500).json({ error: err.message });
  }
}

// Get bill by ID (calls Billing Service)
export async function getBill(req: Request, res: Response) {
  const { billingId } = req.params;
  if (!isValidSSN(billingId)) {
    return res.status(400).json({ error: 'Invalid billingId format' });
  }
  try {
    const response = await axios.get(`${process.env.BILLING_SERVICE_URL}/bills/${billingId}`, {
      headers: { Authorization: req.headers.authorization || '' },
    });
    return res.status(200).json(response.data);
  } catch (err: any) {
    return res.status(err.response?.status || 500).json({ error: err.message });
  }
}