import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard-container">
      <header className="admin-dashboard-header">
        <div className="admin-dashboard-logo">Uber Admin</div>
        <h1 className="admin-dashboard-title">Admin Dashboard</h1>
      </header>
      <div className="admin-dashboard-content">
        <p>Welcome, Admin! Use the navigation below to manage the system.</p>
        <div className="admin-dashboard-buttons">
          <button className="admin-dashboard-button" onClick={() => navigate('/')}>Home</button>
          {/* Add more navigation/actions as needed */}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
