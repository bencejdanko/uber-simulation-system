import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerBillingList.css';

const CustomerBillingList = () => {
  const navigate = useNavigate();

  // Placeholder for authentication check
  const isAuthenticated = true;

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      navigate('/login-customer');
    }
  }, [isAuthenticated, navigate]);

  const [billingHistory] = useState([
    {
      billingId: '847-29-1234',
      rideId: 'R123-45-6789',
      customerId: 'C123-45-6789',
      date: '2025-04-12',
      distanceCovered: 10,
      amount: 24.5,
      paymentStatus: 'Paid',
    },
    {
      billingId: '846-23-5678',
      rideId: 'R123-45-6790',
      customerId: 'C123-45-6790',
      date: '2025-04-08',
      distanceCovered: 5,
      amount: 18.75,
      paymentStatus: 'Paid',
    },
    {
      billingId: '845-02-3456',
      rideId: 'R123-45-6791',
      customerId: 'C123-45-6791',
      date: '2025-04-02',
      distanceCovered: 31,
      amount: 32.2,
      paymentStatus: 'Failed',
    },
    {
      billingId: '843-21-4321',
      rideId: 'R123-45-6792',
      customerId: 'C123-45-6792',
      date: '2025-03-28',
      distanceCovered: 13,
      amount: 15.5,
      paymentStatus: 'Paid',
    },
    {
      billingId: '842-10-9876',
      rideId: 'R123-45-6793',
      customerId: 'C123-45-6793',
      date: '2025-03-23',
      distanceCovered: 1,
      amount: 27.8,
      paymentStatus: 'Paid',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const handleDownloadReceipt = (billingId) => {
    console.log(`Download receipt for billing ID ${billingId}`);
  };

  const filteredBillingHistory = billingHistory.filter((transaction) => {
    const matchesSearchTerm =
      transaction.billingId.includes(searchTerm) ||
      transaction.rideId.includes(searchTerm) ||
      transaction.customerId.includes(searchTerm);
    const matchesStatus =
      !filterStatus || transaction.paymentStatus.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearchTerm && matchesStatus;
  });

  return (
    <div className="billing-container">
      <header className="billing-header">
        <div className="billing-logo">Uber</div>
        <div className="billing-title">Billing History</div>
      </header>

      <div className="billing-section">
        <h2 className="section-title">Billing History</h2>

        {/* Search and Filter Section */}
        <div className="filter-section">
          <input
            type="text"
            placeholder="Search by Billing ID, Ride ID, or Customer ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <table className="billing-table">
          <thead>
            <tr>
              <th>Billing ID</th>
              <th>Date</th>
              <th>Distance (mi)</th>
              <th>Amount ($)</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBillingHistory.map((transaction) => (
              <tr key={transaction.billingId}>
                <td>{transaction.billingId}</td>
                <td>{transaction.date}</td>
                <td>{transaction.distanceCovered}</td>
                <td>${transaction.amount.toFixed(2)}</td>
                <td>
                  <span className={`status ${transaction.paymentStatus.toLowerCase()}`}>
                    {transaction.paymentStatus}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleDownloadReceipt(transaction.billingId)}
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

      <div className="navigation-buttons">
        <button className="nav-button" onClick={() => navigate('/')}>
          Home
        </button>
        <button className="nav-button" onClick={() => navigate('/customer/dashboard')}>
          Customer Dashboard
        </button>
        <button className="nav-button" onClick={() => navigate('/customer/ride-history')}>
          Customer Ride History
        </button>
        <button className="nav-button" onClick={() => navigate('/customer/request-ride')}>
          Customer Ride Request
        </button>
        <button className="nav-button" onClick={() => navigate('/customer/wallet')}>
          Customer Wallet
        </button>
      </div>
    </div>
  );
};

export default CustomerBillingList;