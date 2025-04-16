import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerBillingList.css';

const CustomerBillingList = () => {
  const navigate = useNavigate();

  // Placeholder for authentication check
  const isAuthenticated = true; // Replace with actual authentication logic later

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      navigate('/login-customer');
    }
  }, [isAuthenticated, navigate]);

  const billingHistory = [
    {
      id: '847-29-1234',
      date: 'Apr 12, 2025',
      pickupTime: '10:00 AM',
      dropOffTime: '10:30 AM',
      distance: 10,
      predictedAmount: 25.0,
      actualAmount: 24.5,
      source: 'Downtown',
      destination: 'Airport',
      driverId: 'D12345',
      customerId: 'C67890',
      status: 'Paid',
    },
    {
      id: '846-23-5678',
      date: 'Apr 8, 2025',
      pickupTime: '2:00 PM',
      dropOffTime: '2:20 PM',
      distance: 5,
      predictedAmount: 20.0,
      actualAmount: 18.75,
      source: 'Mall',
      destination: 'University',
      driverId: 'D54321',
      customerId: 'C67890',
      status: 'Paid',
    },
    {
      id: '845-02-3456',
      date: 'Apr 2, 2025',
      pickupTime: '8:00 AM',
      dropOffTime: '8:45 AM',
      distance: 31,
      predictedAmount: 35.0,
      actualAmount: 32.2,
      source: 'Suburbs',
      destination: 'Downtown',
      driverId: 'D67890',
      customerId: 'C67890',
      status: 'Paid',
    },
  ];

  const handleDownloadReceipt = (id) => {
    console.log(`Download receipt for transaction ${id}`);
  };

  return (
    <div className="billing-container">
      <header className="billing-header">
        <div className="billing-logo">Uber</div>
        <div className="billing-title">Billing Information</div>
      </header>

      <div className="billing-section">
        <h2 className="section-title">Billing Details</h2>
        <table className="billing-table">
          <thead>
            <tr>
              <th>Billing ID</th>
              <th>Date</th>
              <th>Pickup Time</th>
              <th>Drop Off Time</th>
              <th>Distance (mi)</th>
              <th>Predicted Amount ($)</th>
              <th>Actual Amount ($)</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Driver ID</th>
              <th>Customer ID</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {billingHistory.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.id}</td>
                <td>{transaction.date}</td>
                <td>{transaction.pickupTime}</td>
                <td>{transaction.dropOffTime}</td>
                <td>{transaction.distance}</td>
                <td>${transaction.predictedAmount.toFixed(2)}</td>
                <td>${transaction.actualAmount.toFixed(2)}</td>
                <td>{transaction.source}</td>
                <td>{transaction.destination}</td>
                <td>{transaction.driverId}</td>
                <td>{transaction.customerId}</td>
                <td>
                  <span className={`status ${transaction.status.toLowerCase()}`}>
                    {transaction.status}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleDownloadReceipt(transaction.id)}
                    className="receipt-button"
                  >
                    Receipt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerBillingList;
