const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Admin login route
app.post('/api/v1/auth/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  // Check default admin credentials
  if (email === 'admin@uber.com' && password === 'admin123') {
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: 'admin-1',
          email: 'admin@uber.com',
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User'
        },
        token: 'admin-jwt-token-for-demo-purpose'
      }
    });
  }
  
  return res.status(401).json({
    success: false,
    error: 'Invalid admin credentials'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth-service' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
}); 