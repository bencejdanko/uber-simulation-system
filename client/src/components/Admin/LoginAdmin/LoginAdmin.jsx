import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import axios from 'axios';
import './LoginAdmin.css';

// API base URL - pointing to the simple auth server
const API_BASE_URL = 'http://localhost:8000';

const LoginAdmin = () => {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Clear any errors when input changes
  useEffect(() => {
    if (error) setError('');
  }, [user, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // console.log('Attempting login with:', { user, password }); // Corrected to use 'user'
      
      // // Make login request directly to the simple auth server
      // const response = await axios.post(`${API_BASE_URL}/api/v1/auth/admin/login`, {
      //   username: user, // Assuming backend expects 'username'
      //   password
      // });

      // console.log('Login response:', response.data);

      // Hardcoded check (current implementation)
      if (user === 'admin' && password === 'pass') {
        // Store token and user info
        // localStorage.setItem('token', response.data.data.token); // If using API
        // localStorage.setItem('user', JSON.stringify(response.data.data.user)); // If using API
        localStorage.setItem('userType', 'admin'); // For client-side role checking
        localStorage.setItem('adminUser', JSON.stringify({ username: user })); // Storing admin user info
        
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        // setError('Invalid response from server'); // This error message might be misleading for hardcoded check
        setError('Invalid username or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      // if (err.response && err.response.data && err.response.data.message) {
      //   setError(err.response.data.message);
      // } else {
      //   setError('Invalid credentials or server error');
      // }
      setError('Invalid credentials or server error. Please try again.'); // Simplified error for now
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container admin-login-page"> 
      <div className="card"> 
        <h2 className="title">Admin Login</h2> 
        
        <form onSubmit={handleSubmit}> 
          <div>
            <input
              type="text"
              placeholder="Username"
              className="input" 
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Password"
              className="input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="button" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {/* Changed the Home button to a Link component, kept inside the form for positioning */}
          <Link to="/" className="button home-button-form"> {/* Added a more specific class if needed */}
            Home
          </Link>
          
          {error && <p className="error-message form-error-message">{error}</p>} 
        </form>
      </div>
    </div>
  );
};

export default LoginAdmin;