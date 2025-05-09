import React, { useState, useEffect } from 'react';
import './LoginDriver.css';
import { useNavigate } from 'react-router-dom';
import { useLoginDriverMutation } from '../../api/apiSlice';

const LoginDriver = () => {
  const navigate = useNavigate();
  const [loginDriver, { isLoading, error }] = useLoginDriverMutation();

  const [credentials, setCredentials] = useState({
    email: '', 
    password: '',
  });


  const navigateIfLoggedIn = () => {
    const token = localStorage.getItem('driverToken');
    if (token) {
      navigate('/driver/dashboard');
    }
  }

  useEffect(() => {
    navigateIfLoggedIn();
  }, []);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const { accessToken } = await loginDriver(credentials).unwrap();
      console.log('Driver logged in successfully, token:', accessToken);

      localStorage.setItem('driverToken', accessToken);
      // dispatch(setDriverLoggedIn(true));

      navigate('/driver/dashboard');

    } catch (err) {
      console.error('Failed to login driver:', err);

    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Driver Login</h1>
      <form className="login-form" onSubmit={handleLogin}>
        <input
          type="email" 
          placeholder="Email"
          name="email"
          className="login-input"
          value={credentials.email}
          onChange={handleInputChange}
          required
        />
        <input
          type="password"
          placeholder="Password"
          name="password"
          className="login-input"
          value={credentials.password}
          onChange={handleInputChange}
          required
        />
        <button type="submit" className="login-button" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        {error && (
          <p className="error-message">
            Error: {error.data?.message || error.error || 'Login failed. Please check credentials.'}
          </p>
        )}
      </form>
      <button className="home-button" onClick={() => navigate('/')}>
        Home
      </button>
    </div>
  );
};

export default LoginDriver;