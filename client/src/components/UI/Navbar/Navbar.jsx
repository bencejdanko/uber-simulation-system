import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css'; // We'll create this next

const Navbar = () => {
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Logic for handling clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('customerToken'); // Or your specific token key
    // Potentially dispatch logout action if using Redux/Context for global state
    // dispatch(apiSlice.util.resetApiState()); // If you want to clear RTK Query cache on logout
    navigate('/login-customer'); // Or a more generic login page like '/login'
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleDropdownNavigation = (path) => {
    navigate(path);
    setIsProfileDropdownOpen(false); // Close dropdown after navigation
  };

  return (
    <nav className="top-navbar">
      <div className="navbar-brand" onClick={() => navigate('/')}>
        {/* Replace "AppLogo" with your actual logo component or <img> tag */}
        Uber
      </div>
      <div className="navbar-links">
        <button className="navbar-button" onClick={() => navigate('/customer/request-ride')}>Ride</button>
        <button className="navbar-button" onClick={() => navigate('/driver/dashboard')}>Drive</button>
        <button className="navbar-button" onClick={() => navigate('/business')}>Business</button>
      </div>
      <div className="navbar-actions">
        <div className="profile-icon-container" ref={dropdownRef}>
          <button onClick={toggleProfileDropdown} className="profile-icon-button" title="Profile">
            {/* Replace with actual Profile icon */}
            👤
          </button>
          {isProfileDropdownOpen && (
            <div className="profile-dropdown-menu">
              <button onClick={() => handleDropdownNavigation('/customer/profile')}>My Profile</button> {/* Added Profile button */}
              <button onClick={() => handleDropdownNavigation('/customer/ride-history')}>History</button>
              <button onClick={() => handleDropdownNavigation('/customer/billing-history')}>Billing</button>
              <button onClick={() => handleDropdownNavigation('/customer/wallet')}>Wallet</button>
              <button onClick={handleLogout} className="logout-button-text">Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;