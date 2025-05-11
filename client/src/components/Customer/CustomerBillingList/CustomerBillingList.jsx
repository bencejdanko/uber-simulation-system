import React, { useState } from 'react'; // Removed useEffect
import { useNavigate } from 'react-router-dom';
import useCustomerAuth from '../../../hooks/useCustomerAuth'; // Import the hook
import './CustomerBillingList.css';
// Assuming you might have an API slice for billing:
// import { useGetBillingHistoryQuery } from '../../../api/apiSlice';

const CustomerBillingList = () => {
  const navigate = useNavigate();
  const { userId, authChecked, error: authError } = useCustomerAuth('customerToken', '/login-customer');

  // Placeholder for billing history - replace with actual API call using userId
  // const { data: billingHistory, isLoading, error: apiError } = useGetBillingHistoryQuery(userId, {
  //   skip: !userId || !authChecked,
  // });
  const [billingHistory_placeholder, setBillingHistory_placeholder] = useState([
    {
      billingId: '847-29-1234',
      rideId: 'R123-45-6789',
      customerId: 'C123-45-6789',
      date: '2025-04-12',
      distanceCovered: 10,
      amount: 24.5,
      paymentStatus: 'Paid',
    },
    // ... more placeholder data
  ]);


  if (!authChecked) {
    return <div className="billing-loading"><p>Authenticating...</p></div>;
  }

  if (!userId && authChecked) {
    return <div className="billing-loading"><p>Session invalid. Redirecting to login...</p></div>;
  }

  // if (isLoading) return <div className="billing-loading"><p>Loading billing history...</p></div>;
  // if (apiError) return <div className="billing-error"><p>Error loading billing history: {apiError.message || 'Please try again.'}</p></div>;


  return (
    <div className="customer-billing-list-container">
      <header className="billing-list-header">
        <h2>Billing History</h2>
      </header>
      {authError && <p className="error-message">Authentication Error: {authError}</p>}
      {billingHistory_placeholder && billingHistory_placeholder.length > 0 ? (
        <div className="billing-table-container">
          <table className="billing-table">
            <thead>
              <tr>
                <th>Billing ID</th>
                <th>Ride ID</th>
                <th>Date</th>
                <th>Distance (km)</th>
                <th>Amount ($)</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {billingHistory_placeholder.map((item) => (
                <tr key={item.billingId}>
                  <td>{item.billingId}</td>
                  <td>{item.rideId}</td>
                  <td>{item.date}</td>
                  <td>{item.distanceCovered}</td>
                  <td>{item.amount.toFixed(2)}</td>
                  <td>
                    <span className={`status ${item.paymentStatus.toLowerCase()}`}>
                      {item.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-history">No billing records found.</p>
      )}
      <div className="navigation-buttons">
        <button className="nav-button" onClick={() => navigate('/customer/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default CustomerBillingList;