import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DriverDashboard.css';

const DriverDashboard = () => {
  const navigate = useNavigate();

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
      </div>
    </div>
  );
};

export default DriverDashboard;