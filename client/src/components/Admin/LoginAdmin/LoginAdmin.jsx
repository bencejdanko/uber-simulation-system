import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginAdmin.css';

// API base URL - pointing to the simple auth server
const API_BASE_URL = 'http://localhost:8000';

const LoginAdmin = () => {
  const [email, setEmail] = useState('admin@uber.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Clear any errors when input changes
  useEffect(() => {
    if (error) setError('');
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', { email, password });
      
      // Make login request directly to the simple auth server
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/admin/login`, {
        email,
        password
      });

      console.log('Login response:', response.data);

      if (response.data && response.data.success) {
        // Store token and user info
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        localStorage.setItem('role', 'admin');
        
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid credentials or server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <h2 className="admin-login-title">Admin Login</h2>
      
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button 
          type="submit" 
          className="admin-login-button"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        {error && <p className="admin-login-error">{error}</p>}
      </form>
    </div>
  );
};

export default LoginAdmin;
