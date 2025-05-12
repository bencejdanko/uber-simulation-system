const express = require('express');
const router = express.Router();

// Simple admin authentication route
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  
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

module.exports = router; 