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

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="home-logo">Uber</div>
        <h1 className="home-title">Welcome to Uber Simulation</h1>
      </header>
      <div className="home-buttons">
        <button className="home-button" onClick={handleCustomerLogin}>
          Customer Login
        </button>
        <button className="home-button" onClick={handleDriverLogin}>
          Driver Login
        </button>
      </div>
    </div>
  );
};

export default HomePage;