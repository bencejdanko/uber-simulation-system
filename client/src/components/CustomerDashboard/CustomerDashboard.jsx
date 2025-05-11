import React, { useEffect } from 'react'; // Removed useState, useRef as they were for navbar
import { useNavigate } from 'react-router-dom';
import './CustomerDashboard.css'; // Styles for dashboard content only
// Optional: If you have a Redux slice for auth state (beyond RTK Query)
// import { useDispatch } from 'react-redux';
// import { setCustomerLoggedOut } from '../auth/authSlice'; // Example action

import { useGetCustomerByIdQuery } from '../../api/apiSlice';

const CustomerDashboard = ({ userId }) => {
  const navigate = useNavigate();
  // const dispatch = useDispatch();

  const { data: customerData, error: customerError, isLoading: customerLoading } = useGetCustomerByIdQuery(userId, {
    skip: !userId,
  });

  // Navbar specific state and logic (isProfileDropdownOpen, dropdownRef, handleLogout, toggleProfileDropdown, handleDropdownNavigation)
  // and the associated useEffect for handleClickOutside have been moved to Navbar.jsx

  useEffect(() => {
    console.log("Customer UserID:", userId);
    // You might still want an auth check here, or handle it in a ProtectedRoute component
    if (!localStorage.getItem('accessToken')) {
        // navigate('/login-customer'); // Or redirect via ProtectedRoute
    }
    // The handleClickOutside logic for dropdown is now in Navbar.jsx
  }, [userId, navigate]); // Removed dropdownRef from dependencies

  // handleLogout, toggleProfileDropdown, handleDropdownNavigation are now in Navbar.jsx

  return (
    // The className "customer-dashboard-layout" might be better on a Layout component
    // For now, we'll keep it, but the content div is more specific to this page
    <div className="customer-dashboard-content-wrapper"> {/* Renamed for clarity, or use a Layout component */}
      <h1>Welcome to the Customer Dashboard</h1>
      
      {customerLoading && <p>Loading customer data...</p>}
      {customerError && <p>Error loading customer data: {customerError.data?.message || customerError.error}</p>}
      {customerData && (
        <div className="customer-info">
          <h2>Customer Information</h2>
          <p>Name: {customerData.firstName} {customerData.lastName}</p>
          <p>Email: {customerData.email}</p>
          <p>Phone: {customerData.phoneNumber}</p>
        </div>
      )}

      <div className="request-ride-prompt-section">
        <h2>Ready for your next journey?</h2>
        <p>Whether it's a quick trip across town or a ride to the airport, we're here to get you there.</p>
        <button 
          className="action-button request-ride-button" 
          onClick={() => navigate('/customer/request-ride')}
        >
          Request a Ride Now
        </button>
      </div>
    </div>
  );
};

export default CustomerDashboard;
