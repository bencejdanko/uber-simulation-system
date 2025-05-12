import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DriverEarnings.css';

const DriverEarnings = () => {
  const navigate = useNavigate();

  const [billingRecords, setBillingRecords] = useState([
    {
      id: 'B123-45-6789',
      rideId: 'R123-45-6789',
      date: '2025-04-15',
      amount: '$25.00',
      paymentStatus: 'Paid',
    },
    {
      id: 'B123-45-6790',
      rideId: 'R123-45-6790',
      date: '2025-04-14',
      amount: '$18.75',
      paymentStatus: 'Pending',
    },
    {
      id: 'B123-45-6791',
      rideId: 'R123-45-6791',
      date: '2025-04-13',
      amount: '$0.00',
      paymentStatus: 'Failed',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState('');

  const handleDownloadReceipt = (billingId) => {
    console.log(`Downloading receipt for billing ID: ${billingId}`);
    // Logic to download the receipt can be added here
  };

  const handleCancelPendingRide = (billingId) => {
    setBillingRecords((prevRecords) =>
      prevRecords.map((record) =>
        record.id === billingId && record.paymentStatus === 'Pending'
          ? { ...record, paymentStatus: 'Cancelled' }
          : record
      )
    );
    console.log(`Cancelled pending ride with billing ID: ${billingId}`);
  };

  const filteredBillingRecords = billingRecords.filter(
    (record) =>
      !filterStatus || record.paymentStatus.toLowerCase() === filterStatus.toLowerCase()
  );

  return (
    <div className="driver-manage-billing-container">
      <header className="billing-header">
        <div className="billing-logo">Uber</div>
        <div className="billing-title">Driver Manage Billing</div>
      </header>

      <div className="billing-section">
        <h2 className="section-title">Billing Records</h2>

        <div className="filter-section">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <table className="billing-table">
          <thead>
            <tr>
              <th>Billing ID</th>
              <th>Ride ID</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Payment Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBillingRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.rideId}</td>
                <td>{record.date}</td>
                <td>{record.amount}</td>
                <td>
                  <span className={`status ${record.paymentStatus.toLowerCase()}`}>
                    {record.paymentStatus}
                  </span>
                </td>
                <td>
                  {record.paymentStatus === 'Pending' ? (
                    <button
                      onClick={() => handleCancelPendingRide(record.id)}
                      className="cancel-button"
                    >
                      Cancel Ride
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownloadReceipt(record.id)}
                      className="download-button"
                    >
                      Download Receipt
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="navigation-buttons">
        <button className="nav-button" onClick={() => navigate('/')}>
          Homepage
        </button>
        <button className="nav-button" onClick={() => navigate('/driver/dashboard')}>
          Driver Dashboard
        </button>
        <button className="nav-button" onClick={() => navigate('/driver/manage-rides')}>
          Manage Rides
        </button>
      </div>
    </div>
  );
};

export default DriverEarnings;