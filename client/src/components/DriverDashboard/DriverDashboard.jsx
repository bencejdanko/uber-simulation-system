import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DriverDashboard.css';
// Optional: If you have a Redux slice for auth state (beyond RTK Query)
// import { useDispatch } from 'react-redux';
// import { setDriverLoggedOut } from '../auth/authSlice'; // Example action

import { useGetDriverByIdQuery } from '../../api/apiSlice';
import { extractClaims } from '../../utils/extractClaims';

const DriverDashboard = () => {
  const navigate = useNavigate();
  // Optional: Get dispatch function if using a separate auth slice
  // const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('driverToken');

    if (!token) {
      navigate('/'); // Redirect to login if no token
    }

    // extract info from token
    const { sub, roles } = extractClaims(token);
    console.log('Driver ID:', sub);
    console.log('Driver Roles:', roles);
  })

  // Function to handle logout
  const handleLogout = () => {
    // 1. Clear the stored token
    localStorage.removeItem('driverToken');
    console.log('Driver token removed.');

    // 2. Optional: Dispatch action to clear Redux auth state
    // dispatch(setDriverLoggedOut());

    // 3. Optional: Reset RTK Query state if needed (often clearing token is enough)
    // dispatch(apiSlice.util.resetApiState()); // Be cautious, resets ALL API state

    // 4. Redirect to login or home page
    navigate('/'); // Or navigate('/')
  };

  return (
    <div className="driver-dashboard-container">
      <h1>Welcome to the Driver Dashboard</h1>
      <p>This is the dashboard for drivers.</p>

      <div className="navigation-buttons">
        <button className="nav-button" onClick={() => navigate('/')}>
          Home
        </button>
        <button className="nav-button" onClick={() => navigate('/driver/manage-rides')}>
          Manage Rides
        </button>
        <button className="nav-button" onClick={() => navigate('/driver/earnings')}>
          Driver Earnings
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

export default DriverDashboard;