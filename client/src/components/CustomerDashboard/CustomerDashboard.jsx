import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerDashboard.css';
// Optional: If you have a Redux slice for auth state (beyond RTK Query)
// import { useDispatch } from 'react-redux';
// import { setCustomerLoggedOut } from '../auth/authSlice'; // Example action

import { useGetCustomerByIdQuery } from '../../api/apiSlice';

const CustomerDashboard = ({ userId }) => {
  const navigate = useNavigate();
  // Optional: Get dispatch function if using a separate auth slice
  // const dispatch = useDispatch();

  const { data: customerData, error, isLoading } = useGetCustomerByIdQuery(userId);

  useEffect(() => {
    console.log("Customer UserID:", userId); // Log the userId to check

  }, [userId]);

  // Function to handle logout
  const handleLogout = () => {
    // 1. Clear the stored token
    localStorage.removeItem('customerToken');
    console.log('Customer token removed.');

    // 2. Optional: Dispatch action to clear Redux auth state
    // dispatch(setCustomerLoggedOut());

    // 3. Optional: Reset RTK Query state if needed (often clearing token is enough)
    // dispatch(apiSlice.util.resetApiState()); // Be cautious, resets ALL API state

    // 4. Redirect to login or home page
    navigate('/login-customer');
  };

  return (
    <div className="customer-dashboard-container">
      <h1>Welcome to the Customer Dashboard</h1>
      <p>This is the dashboard for customers.</p>
      {isLoading && <p>Loading customer data...</p>}
      {error && <p>Error loading customer data: {error.message}</p>}
      {customerData && (
        <div className="customer-info">
          <h2>Customer Information</h2>
          <p>Name: {customerData.name}</p>
          <p>Email: {customerData.email}</p>
          <p>Phone: {customerData.phone}</p>
          {/* Add more customer information as needed */}
        </div>
      )}

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
        <button className="nav-button" onClick={() => navigate('/admin/dashboard')}>
          Admin Dashboard
        </button>
        {/* Add Logout Button */}
        <button className="nav-button logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default CustomerDashboard;
