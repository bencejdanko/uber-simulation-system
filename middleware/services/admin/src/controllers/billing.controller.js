const Bill = require('../models/billing.model');

exports.getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find({});
    res.status(200).json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBillById = async (req, res) => {
  try {
    const bill = await Bill.findOne({ billingId: req.params.billing_id });
    if (!bill) return res.sendStatus(404);
    res.status(200).json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
