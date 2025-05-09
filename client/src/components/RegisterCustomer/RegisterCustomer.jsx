import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterCustomer.css';
import { useRegisterCustomerMutation } from '../../api/apiSlice';

const RegisterCustomer = () => {
  const navigate = useNavigate();
  const [registerCustomer, { isLoading, error: mutationError, isSuccess }] = useRegisterCustomerMutation();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    zipCode: '',
    agreeToTerms: false,
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
    } else if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

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
      const { confirmPassword, ...registrationData } = formData;
      await registerCustomer(registrationData).unwrap();
    } catch (err) {
      console.error('Failed to register customer:', err);
      if (err.data && err.data.errors) {
        setErrors(err.data.errors);
      } else if (err.data && err.data.message) {
        setErrors({ form: err.data.message });
      } else {
        setErrors({ form: 'Registration failed. Please try again.' });
      }
    }
  };

  useEffect(() => {
    if (isSuccess) {
      // Optional: Add a delay before navigating or let the success message be shown
    }
  }, [isSuccess, navigate]);

  if (isSuccess) {
    return (
      <div className="container">
        <div className="card text-center">
          <div className="title">Uber</div>
          <h2 className="title">Registration Complete!</h2>
          <p>Thank you for registering with Uber.</p>
          <p>You can now log in to your account.</p>
          <button onClick={() => navigate('/')} className="button">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <button onClick={() => navigate('/')} className="home-button">
        Home
      </button>

      <div className="card">
        <div className="title">Uber</div>
        <h1 className="title">Create your Uber account</h1>

        <form onSubmit={handleSubmit}>
          <div>
            <label className="label">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`input ${errors.firstName ? 'input-error' : ''}`}
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
            />
            {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
          </div>

          <div>
            <label className="label">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`input ${errors.address ? 'input-error' : ''}`}
            />
            {errors.address && <p className="error-message">{errors.address}</p>}
          </div>

          <div>
            <label className="label">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={`input ${errors.city ? 'input-error' : ''}`}
            />
            {errors.city && <p className="error-message">{errors.city}</p>}
          </div>

          <div>
            <label className="label">ZIP Code</label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className={`input ${errors.zipCode ? 'input-error' : ''}`}
            />
            {errors.zipCode && <p className="error-message">{errors.zipCode}</p>}
          </div>

          <div>
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="checkbox"
            />
            <label className="label">I agree to Uber's Terms of Service and Privacy Policy</label>
            {errors.agreeToTerms && <p className="error-message">{errors.agreeToTerms}</p>}
          </div>

          <button type="submit" className="button" disabled={isLoading}>
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </button>
          {mutationError && (
            <p className="error-message">
              {mutationError.data?.message || mutationError.error || 'Registration failed. Please try again.'}
            </p>
          )}
          {errors.form && <p className="error-message">{errors.form}</p>}
        </form>
      </div>
    </div>
  );
};

export default RegisterCustomer;