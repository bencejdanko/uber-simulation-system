import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterDriverMutation } from '../../../api/apiSlice';
import './RegisterDriver.css';

const RegisterDriver = () => {
  const navigate = useNavigate();
  const [registerDriver, { isLoading, error }] = useRegisterDriverMutation();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
  });


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const registrationData = { ...formData };

    console.log('Submitting registration data:', registrationData);

    try {
      const { accessToken } = await registerDriver(registrationData).unwrap();

      console.log('Driver Registration Successful, token:', accessToken);
      localStorage.setItem('driverToken', accessToken);
      // dispatch(setDriverLoggedIn(true));

      navigate('/driver/dashboard');

    } catch (err) {
      console.error('Failed to register driver:', err);
    }
  };

  return (
    <div className="register-driver-container">
      <header className="register-driver-header">
        <h1>Driver Registration</h1>
      </header>
      <button className="home-button" onClick={() => navigate('/')}>Home</button>

      <form className="register-driver-form" onSubmit={handleSubmit}>
        <h2>Account Information</h2>
        <label>
          First Name:
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Last Name:
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            minLength="8"
          />
        </label>
        <label>
          Phone Number:
          <input
            type="text"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            required 
          />
        </label>

        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
        {error && (
          <p className="error-message">
            Error: {error.data?.message || error.error || 'Registration failed. Please try again.'}
          </p>
        )}
      </form>
    </div>
  );
};

export default RegisterDriver;