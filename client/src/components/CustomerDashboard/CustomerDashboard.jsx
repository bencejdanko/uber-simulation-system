import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerDashboard.css';
import { useGetCustomerByIdQuery } from '../../api/apiSlice';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  // Example: Replace '1' with the actual customer ID from auth/user context
  const { data, error, isLoading } = useGetCustomerByIdQuery('1');

  return (
    <div className="dashboard-container">
      <h1>Welcome to the Customer Dashboard</h1>
      {isLoading && <p>Loading customer data...</p>}
      {error && <p>Error loading customer data.</p>}
      {data && (
        <div>
          <p><strong>Name:</strong> {data.name}</p>
          <p><strong>Email:</strong> {data.email}</p>
        </div>
      )}
      <p>This is the dashboard for customers.</p>
      <div className="navigation-buttons">
        <button className="nav-button" onClick={() => navigate('/')}>Home</button>
        <button className="nav-button" onClick={() => navigate('/customer/ride-history')}>Customer Ride History</button>
        <button className="nav-button" onClick={() => navigate('/customer/request-ride')}>Customer Ride Request</button>
        <button className="nav-button" onClick={() => navigate('/customer/billing-list')}>Customer Billing</button>
        <button className="nav-button" onClick={() => navigate('/customer/wallet')}>Customer Wallet</button>
      </div>
    </div>
  );
};

export default CustomerDashboard;