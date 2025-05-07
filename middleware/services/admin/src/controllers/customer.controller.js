const Customer = require('../models/customer.model');
const { sendCustomerCreated } = require('../kafka/producer'); // Assuming you have a similar Kafka producer function for customer events

exports.createCustomer = async (req, res) => {
  try {
    // Create customer from the request body
    const customer = await Customer.create(req.body);

    // Prepare the customer event for Kafka
    await sendCustomerCreated({
      eventType: 'PROFILE_CREATED',
      timestamp: new Date().toISOString(),
      customerId: customer.customerId,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      address: customer.address,
      creditCardDetails: customer.creditCardDetails, // Ensure sensitive info is masked/tokenized
    });

    // Respond with the created customer
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerId: req.params.customer_id });
    if (!customer) return res.sendStatus(404);
    
    // Respond with the customer, masking sensitive credit card info
    const customerResponse = {
      ...customer.toObject(),
      creditCardDetails: {
        last4Digits: customer.creditCardDetails.last4Digits,
        cardType: customer.creditCardDetails.cardType,
        expiryMonth: customer.creditCardDetails.expiryMonth,
        expiryYear: customer.creditCardDetails.expiryYear,
      }
    };

    res.status(200).json(customerResponse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
