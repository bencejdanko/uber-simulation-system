import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginCustomer.css';

const LoginCustomer = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    const isAuthenticated = true; // Placeholder for authentication logic

    if (isAuthenticated) {
      console.log('Customer logged in');
      navigate('/customer/dashboard'); 
    } else {
      console.log('Login failed');
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Customer Login</h1>
      <form className="login-form" onSubmit={handleLogin}>
        <input type="text" placeholder="Email" className="login-input" required />
        <input type="password" placeholder="Password" className="login-input" required />
        <button type="submit" className="login-button">Login</button>
      </form>
      <button className="home-button" onClick={() => navigate('/')}>
        Home
      </button>
    </div>
  );
};

export default LoginCustomer;