import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterDriverMutation } from '../../../api/apiSlice';
import './RegisterDriver.css'; // We will update this file

const RegisterDriver = () => {
  const navigate = useNavigate();
  const [registerDriver, { isLoading, error: mutationError, isSuccess, data: successData }] = useRegisterDriverMutation();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    // Add other driver-specific fields here if needed, e.g., licenseNumber, vehicleDetails
    // For now, keeping it similar to customer registration fields
    agreeToTerms: false, // Assuming drivers also need to agree to terms
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(formData.phoneNumber.replace(/\D/g, ''))) { // Allow for international numbers too
      newErrors.phoneNumber = 'Phone number must be 10-15 digits';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions for drivers';
    }
    // Add validation for other driver-specific fields if any

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setErrors({});

    try {
      // Destructure to remove confirmPassword before sending, and any other client-only fields
      const { confirmPassword, ...registrationData } = formData;
      const result = await registerDriver(registrationData).unwrap();

      // Assuming the token is in result.accessToken as per original code
      if (result && result.accessToken) {
        localStorage.setItem('driverToken', result.accessToken);
        // navigate('/driver/dashboard'); // Navigation handled in useEffect
      } else {
        // Handle case where registration is successful but no token is returned as expected
        console.warn('Driver registration successful, but no access token received in expected format.');
        setErrors({ form: 'Registration completed, but login might be required.' });
      }
    } catch (err) {
      console.error('Failed to register driver:', err);
      if (err.data && err.data.errors) { // If backend sends field-specific errors
        setErrors(err.data.errors);
      } else if (err.data && err.data.message) {
        setErrors({ form: err.data.message });
      } else {
        setErrors({ form: 'Registration failed. Please try again.' });
      }
    }
  };

  useEffect(() => {
    if (isSuccess && successData && successData.accessToken) {
      // Optional: Add a delay or specific message before navigating
      // For now, direct navigation after successful registration and token receipt
      navigate('/driver/dashboard');
    }
  }, [isSuccess, successData, navigate]);


  // A more generic success screen if needed, or could be part of the useEffect redirect
  if (isSuccess && !(successData && successData.accessToken)) {
    // This case handles if API call was success (2xx) but didn't return token for auto-login
     return (
      <div className="container">
        <div className="card text-center">
          <div className="title">Uber Driver</div>
          <h2 className="title">Registration Submitted!</h2>
          <p>Your driver registration has been submitted.</p>
          <p>Further verification may be required. You will be notified.</p>
          <button onClick={() => navigate('/login-driver')} className="button">
            Go to Driver Login
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="container driver-registration-page"> {/* Added specific class for potential overrides */}
      <button onClick={() => navigate('/')} className="home-button">
        Home
      </button>

      <div className="card">
        <div className="title">Uber Driver</div>
        <h1 className="title">Become an Uber Driver</h1>

        <form onSubmit={handleSubmit}>
          <div>
            <label className="label">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`input ${errors.firstName ? 'input-error' : ''}`}
              required
            />
            {errors.firstName && <p className="error-message">{errors.firstName}</p>}
          </div>

          <div>
            <label className="label">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`input ${errors.lastName ? 'input-error' : ''}`}
              required
            />
            {errors.lastName && <p className="error-message">{errors.lastName}</p>}
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`input ${errors.email ? 'input-error' : ''}`}
              required
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`input ${errors.phoneNumber ? 'input-error' : ''}`}
              required
            />
            {errors.phoneNumber && <p className="error-message">{errors.phoneNumber}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`input ${errors.password ? 'input-error' : ''}`}
              required
              minLength="8"
            />
            {errors.password && <p className="error-message">{errors.password}</p>}
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
              required
            />
            {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
          </div>

          {/* Add other driver-specific fields here, e.g.:
          <div>
            <label className="label">Driver's License Number</label>
            <input type="text" name="licenseNumber" ... />
            {errors.licenseNumber && <p className="error-message">{errors.licenseNumber}</p>}
          </div>
          */}

          <div className="terms-container">
            <input
              type="checkbox"
              id="agreeToTermsDriver"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="checkbox"
            />
            <label htmlFor="agreeToTermsDriver" className="label checkbox-label">
              I agree to Uber's Driver Terms of Service and Privacy Policy
            </label>
            {errors.agreeToTerms && <p className="error-message terms-error">{errors.agreeToTerms}</p>}
          </div>

          <button type="submit" className="button" disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Register as Driver'}
          </button>
          {mutationError && (
            <p className="error-message form-error-message">
              {errors.form || mutationError.data?.message || mutationError.error || 'Registration failed. Please try again.'}
            </p>
          )}
          {errors.form && !mutationError && <p className="error-message form-error-message">{errors.form}</p>}
        </form>
      </div>
    </div>
  );
};

export default RegisterDriver;