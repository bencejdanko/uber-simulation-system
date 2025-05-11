import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginCustomer.css';
// 1. Import the RTK Query hook for customer login
import { useLoginCustomerMutation } from '../../../api/apiSlice'; // Adjust path if needed

const LoginCustomer = () => {
  const navigate = useNavigate();
  // 2. Instantiate the mutation hook
  const [loginCustomer, { isLoading, error: apiError }] = useLoginCustomerMutation();

  // 3. State for form inputs
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  // Optional: Redirect if already logged in (e.g., if token exists)
  useEffect(() => {
    const token = localStorage.getItem('customerToken'); // Or your general token key
    if (token) {
      navigate('/customer/dashboard');
    }
  }, [navigate]);

  // 4. Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 5. Update handleLogin to use the mutation
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Call the mutation trigger with credentials
      // Assuming your API returns an object with accessToken
      const { accessToken } = await loginCustomer(credentials).unwrap();

      // Handle successful login
      console.log('Customer logged in successfully, token:', accessToken);
      // Store the token (e.g., in localStorage)
      localStorage.setItem('customerToken', accessToken); // Use a specific key for customer token
      // Optionally dispatch global state update (e.g., Redux auth slice)
      // dispatch(setCustomerLoggedIn(true));

      navigate('/customer/dashboard'); // Navigate to Customer Dashboard

    } catch (err) {
      // Handle login error
      console.error('Failed to login customer:', err);
      // The apiError state from the hook will be populated with error details
      // You can display err.data?.message or a generic error message below
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Customer Login</h1>
      <form className="login-form" onSubmit={handleLogin}>
        {/* 6. Update input fields */}
        <input
          type="email"
          placeholder="Email"
          name="email" // Add name attribute
          className="login-input"
          value={credentials.email} // Bind value
          onChange={handleInputChange} // Add onChange handler
          required
        />
        <input
          type="password"
          placeholder="Password"
          name="password" // Add name attribute
          className="login-input"
          value={credentials.password} // Bind value
          onChange={handleInputChange} // Add onChange handler
          required
        />
        {/* 7. Add loading/error feedback */}
        <button type="submit" className="login-button" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        {apiError && (
          <p className="error-message" style={{ color: 'red', marginTop: '10px' }}> {/* Basic error styling */}
            Login Failed: {apiError.data?.message || apiError.error || 'Please check your credentials.'}
          </p>
        )}
      </form>
      <button className="home-button" onClick={() => navigate('/')} style={{ marginTop: '20px' }}> {/* Added some margin to home button */}
        Home
      </button>
    </div>
  );
};

export default LoginCustomer;