const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Create Express app
const app = express();
const port = 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Simple admin authentication route
app.post('/api/v1/auth/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, password });
  
  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are required' 
    });
  }
  
  // Check credentials (in a real app, you would check against database and use proper hashing)
  if (email === 'admin@uber.com' && password === 'admin123') {
    return res.status(200).json({
      success: true,
      data: {
        token: 'admin-token-123456789',
        user: {
          id: 'admin-1',
          email: email,
          name: 'Admin User',
          role: 'admin'
        }
      },
      message: 'Admin logged in successfully'
    });
  }
  
  // Invalid credentials
  return res.status(401).json({ 
    success: false, 
    message: 'Invalid credentials' 
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth-service' });
});

// Start server
app.listen(port, () => {
  console.log(`Simple auth server running on port ${port}`);
  console.log('Use admin@uber.com / admin123 to login');
}); 