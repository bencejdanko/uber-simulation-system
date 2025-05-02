import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  const handleCustomerLogin = () => {
    navigate('/login-customer');
  };

  const handleDriverLogin = () => {
    navigate('/login-driver');
  };

  const handleAdminLogin = () => {
    navigate('/login-admin');
  };

  return (
    <div className="home-container sidebar-layout">
      <aside className="sidebar">
        <div className="sidebar-title">Login</div>
        <button className="sidebar-button" onClick={handleCustomerLogin}>
          Customer Login
        </button>
        <button className="sidebar-button" onClick={handleDriverLogin}>
          Driver Login
        </button>
        <button className="sidebar-button" onClick={handleAdminLogin}>
          Admin Login
        </button>
      </aside>
      <main className="main-content">
        <header className="home-header">
          <div className="home-logo">Uber</div>
          <h1 className="home-title">Welcome to Uber Simulation</h1>
        </header>
      </main>
    </div>
  );
};

export default HomePage;