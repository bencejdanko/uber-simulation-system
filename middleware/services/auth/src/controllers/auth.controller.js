// Keep the existing code and add the following handler for admin login

// Add this route handler for admin login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Default admin credentials
    const DEFAULT_ADMIN_EMAIL = 'admin@uber.com';
    const DEFAULT_ADMIN_PASSWORD = 'admin123';
    
    // Check if using default admin credentials
    if (email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
      // Generate token for admin
      const token = 'admin-token-for-demo'; // In a real app, use JWT
      
      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: 'admin-1',
            email: DEFAULT_ADMIN_EMAIL,
            role: 'admin',
            firstName: 'Admin',
            lastName: 'User'
          },
          token
        }
      });
    }
    
    // If not default admin credentials, return error
    return res.status(401).json({
      success: false,
      error: 'Invalid admin credentials'
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Admin login failed'
    });
  }
}; 