import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminFooter = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminUser'); // Or whatever keys you use for admin auth
    localStorage.removeItem('userType');
    // localStorage.removeItem('token'); // if you use tokens
    navigate('/');
  };

  return (
    <div className="admin-dashboard-footer">
      <button className="admin-logout-button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default AdminFooter;