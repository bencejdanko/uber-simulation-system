import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css'; // We'll create this next

const Navbar = () => {
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const decodedPayload = JSON.parse(atob(payloadBase64));
          // Assuming the role is in an array like ["CUSTOMER"] or ["DRIVER"]
          if (decodedPayload.role && Array.isArray(decodedPayload.role) && decodedPayload.role.length > 0) {
            setUserRole(decodedPayload.role[0]);
          } else if (decodedPayload.roles && Array.isArray(decodedPayload.roles) && decodedPayload.roles.length > 0) {
            // Fallback for 'roles' key
            setUserRole(decodedPayload.roles[0]);
          } else {
            console.warn("Role not found or in unexpected format in token payload.");
          }
        }
      } catch (error) {
        console.error("Failed to decode token:", error);
        // Potentially clear token if invalid and logout
        // localStorage.removeItem('accessToken');
        // setUserRole(null);
        // navigate('/login'); // Or appropriate login page
      }
    }
  }, []); // Runs once on component mount

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
    localStorage.removeItem('accessToken'); // Or your specific token key
    setUserRole(null); // Clear the role state
    setIsProfileDropdownOpen(false); // Close dropdown
    // Potentially dispatch logout action if using Redux/Context for global state
    // dispatch(apiSlice.util.resetApiState()); // If you want to clear RTK Query cache on logout
    
    // Navigate to a generic login page or role-specific if preferred
    // For now, keeping the original navigation, but you might want to adjust this
    navigate('/login-customer'); 
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
        <button className="navbar-button" onClick={() => navigate('/login-admin')}>Business</button>
      </div>
      <div className="navbar-actions">
        {userRole && ( // Only show profile icon if a role is determined (i.e., user is logged in)
          <div className="profile-icon-container" ref={dropdownRef}>
            <button onClick={toggleProfileDropdown} className="profile-icon-button" title="Profile">
              {/* Replace with actual Profile icon */}
              👤
            </button>
            {isProfileDropdownOpen && (
              <div className="profile-dropdown-menu">
                {userRole === 'CUSTOMER' && (
                  <>
                    <button onClick={() => handleDropdownNavigation('/customer/profile')}>My Profile</button>
                    <button onClick={() => handleDropdownNavigation('/customer/ride-history')}>History</button>
                    <button onClick={() => handleDropdownNavigation('/customer/billing-history')}>Billing</button>
                    <button onClick={() => handleDropdownNavigation('/customer/wallet')}>Wallet</button>
                  </>
                )}
                {userRole === 'DRIVER' && (
                  <>
                    {/* Assuming driver profile is part of their dashboard */}
                    <button onClick={() => handleDropdownNavigation('/driver/profile')}>My Profile</button>
                    <button onClick={() => handleDropdownNavigation('/driver/manage-rides')}>Manage Rides</button>
                    <button onClick={() => handleDropdownNavigation('/driver/earnings')}>Payment</button>
                    {/* Add other driver-specific links here if needed, e.g., Earnings */}
                    {/* <button onClick={() => handleDropdownNavigation('/driver/earnings')}>Earnings</button> */}
                  </>
                )}
                <button onClick={handleLogout} className="logout-button-text">Logout</button>
              </div>
            )}
          </div>
        )}
        {!userRole && ( // Optional: Show login/signup if no user role (not logged in)
            <button className="navbar-button" onClick={() => navigate('/login-customer')}>Login</button>
            // Or a generic /login that handles both customer and driver
        )}
      </div>
    </nav>
  );
};

export default Navbar;