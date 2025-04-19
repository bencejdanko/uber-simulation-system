import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <h1>Welcome to the Customer Dashboard</h1>
      <p>This is the dashboard for customers.</p>

      <div className="navigation-buttons">
        <button className="nav-button" onClick={() => navigate('/')}>
          Home
        </button>
        <button className="nav-button" onClick={() => navigate('/customer/ride-history')}>
          Customer Ride History
        </button>
        <button className="nav-button" onClick={() => navigate('/customer/request-ride')}>
          Customer Ride Request
        </button>
        <button className="nav-button" onClick={() => navigate('/customer/billing-list')}>
          Customer Billing
        </button>
        <button className="nav-button" onClick={() => navigate('/customer/wallet')}>
          Customer Wallet
        </button>
      </div>
    </div>
  );
};

export default CustomerDashboard;