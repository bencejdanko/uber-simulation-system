import React from 'react';
import './LoginDriver.css';
import { useNavigate } from 'react-router-dom';

const LoginDriver = () => {
    const navigate = useNavigate();

    const handleLogin = (e) => {
      e.preventDefault();
  
      const isAuthenticated = true;  // Placeholder for authentication logic
  
      if (isAuthenticated) {
        console.log('Driver logged in');
        navigate('/driver/dashboard'); // Navigate to Driver Dashboard
      } else {
        console.log('Login failed');
      }
    };

  return (
    <div className="login-container">
      <h1 className="login-title">Driver Login</h1>
      <form className="login-form" onSubmit={handleLogin}>
        <input type="text" placeholder="Driver ID" className="login-input" required />
        <input type="password" placeholder="Password" className="login-input" required />
        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
};

export default LoginDriver;