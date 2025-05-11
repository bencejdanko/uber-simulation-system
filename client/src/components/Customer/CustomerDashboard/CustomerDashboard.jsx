import React from 'react'; // Removed useState, useEffect as they are in the hook
import { useNavigate } from 'react-router-dom'; // Still needed for internal navigation
// jwtDecode is now used within the hook
import './CustomerDashboard.css';
import { useGetCustomerByIdQuery } from '../../../api/apiSlice';
import useCustomerAuth from '../../../hooks/useCustomerAuth'; // Adjust path if your hooks folder is elsewhere

const CustomerDashboard = () => {
  // Use the custom hook for authentication logic
  const { userId, authChecked, error: authError } = useCustomerAuth('accessToken', '/login-customer');
  
  // useNavigate for component-specific navigation (e.g., to request-ride)
  const navigate = useNavigate();

  const { data: customerData, isLoading: customerLoading, error: apiError } = useGetCustomerByIdQuery(userId, {
    skip: !userId || !authChecked, // Skip query if no userId or auth check not complete
  });

  if (!authChecked) {
    // Display a loading message while the authentication check is in progress
    return <div className="dashboard-loading"><p>Authenticating...</p></div>;
  }

  // If authChecked is true but userId is null, it means the hook has initiated navigation
  // to the login page due to an auth issue. This state should be brief.
  if (!userId) {
    // The hook should have already handled navigation. This is a fallback or transient state.
    return <div className="dashboard-loading"><p>Session invalid. Redirecting to login...</p></div>;
  }

  // At this point, authChecked is true and userId is available.
  // Now handle API data loading and display.

  if (customerLoading) {
    return <div className="dashboard-loading"><p>Loading your dashboard...</p></div>;
  }

  if (apiError) {
    console.error("Error fetching customer data:", apiError);
    // You could check apiError.status for specific error handling, e.g.,
    // if (apiError.status === 401 || apiError.status === 403) navigate('/login-customer');
    return (
      <div className="dashboard-error">
        <p>We encountered an error loading your information.</p>
        <p>Please try refreshing the page, or <button onClick={() => navigate('/login-customer', { replace: true })}>log in again</button>.</p>
      </div>
    );
  }
  
  // If we reach here, auth is checked, userId exists, not loading, and no API error (or data is present)

  return (
    <div className="customer-dashboard-content-wrapper">
      <h1>Welcome{customerData ? `, ${customerData.firstName}` : ''}!</h1>
      
      {customerData ? (
        <div className="customer-info">
          <h2>Your Information</h2>
          <p><strong>Name:</strong> {customerData.firstName} {customerData.lastName}</p>
          <p><strong>Email:</strong> {customerData.email}</p>
          <p><strong>Phone:</strong> {customerData.phoneNumber || 'N/A'}</p>
        </div>
      ) : (
        <p>Could not load customer details at the moment.</p>
      )}

      <div className="request-ride-prompt-section">
        <h2>Ready for your next journey?</h2>
        <p>Whether it's a quick trip across town or a ride to the airport, we're here to get you there.</p>
        <button 
          className="action-button request-ride-button" 
          onClick={() => navigate('/customer/request-ride')}
        >
          Request a Ride Now
        </button>
      </div>
    </div>
  );
};

export default CustomerDashboard;
