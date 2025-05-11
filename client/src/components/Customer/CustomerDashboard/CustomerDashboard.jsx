import React, { useEffect, useState } from 'react'; // Added useState
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import jwt-decode
import './CustomerDashboard.css';
import { useGetCustomerByIdQuery } from '../../../api/apiSlice';

// Removed userId from props as we will derive it from the JWT
const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null); // State to hold the userId from JWT
  const [authChecked, setAuthChecked] = useState(false); // State to track if auth check is complete

  useEffect(() => {
    const token = localStorage.getItem('customerToken'); // Assuming 'accessToken' is the key for your JWT
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        // The 'sub' (subject) claim usually holds the user ID
        if (decodedToken && decodedToken.sub) {
          setUserId(decodedToken.sub);
          console.log("Customer UserID from JWT (sub):", decodedToken.sub);
        } else {
          console.error("JWT 'sub' claim not found in decoded token.");
          localStorage.removeItem('customerToken'); // Clear invalid token
          navigate('/login-customer'); // Redirect to login
        }
      } catch (error) {
        console.error("Failed to decode JWT or token is invalid:", error);
        localStorage.removeItem('customerToken'); // Clear corrupted/expired token
        navigate('/login-customer'); // Redirect to login
      }
    } else {
      console.log("No access token found, redirecting to login.");
      navigate('/login-customer'); // Redirect to login if no token
    }
    setAuthChecked(true); // Mark authentication check as complete
  }, [navigate]); // Effect runs on mount or if navigate changes

  // Fetch customer data using the userId derived from the JWT
  // Skip the query if userId is not yet available or if auth check isn't done
  const { data: customerData, isLoading: customerLoading } = useGetCustomerByIdQuery(userId, {
    skip: !userId || !authChecked,
  });

  if (!authChecked) {
    return <p>Authenticating...</p>; // Show authenticating message until token check is done
  }

  // If authChecked is true and still no userId, it means redirection should have happened or is in progress
  // This case is mostly handled by the navigate calls in useEffect, but as a fallback:
  if (!userId && authChecked) {
    // This state implies redirection should have occurred.
    // You might not even see this if navigate works instantly.
    return <p>Redirecting to login...</p>;
  }


  return (
    <div className="customer-dashboard-content-wrapper">
      <h1>Welcome to the Customer Dashboard</h1>
      
      {customerLoading && <p>Loading customer data...</p>}
      
      {userId && customerData && (
        <div className="customer-info">
          <h2>Customer Information</h2>
          <p>Name: {customerData.firstName} {customerData.lastName}</p>
          <p>Email: {customerData.email}</p>
          <p>Phone: {customerData.phoneNumber}</p>
          {/* <p>User ID (from token): {userId}</p> */} {/* Optional: display derived userId */}
        </div>
      )}

      {/* Show prompt only if user is identified and data is loaded or not in error */}
      {userId && (customerData || (!customerLoading)) && (
        <div className="request-ride-prompt-section">
          <h2>Ready for your next journey?</h2>
          <p>Whether it's a quick trip across town or a ride to the airport, we're here to get you there.</p>
          <button 
            className="action-button request-ride-button" 
            onClick={() => navigate('/customer/request-ride')}
            disabled={customerLoading} // Disable if loading or error
          >
            Request a Ride Now
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
