import React from 'react';
import { useNavigate } from 'react-router-dom';
import useCustomerAuth from '../../../hooks/useCustomerAuth';
import './CustomerBillingList.css';
import { useGetBillsByCustomerQuery } from '../../../api/apiSlice';

const CustomerBillingList = ({ userId }) => {
  const navigate = useNavigate();
  const { userId: authUserId, authChecked, error: authError } = useCustomerAuth('accessToken', '/login-customer');

  // Use the userId from auth if not provided as prop
  const effectiveUserId = userId || authUserId;
  const { data: billingHistory, isLoading, error: apiError } = useGetBillsByCustomerQuery(effectiveUserId, {
    skip: !effectiveUserId || !authChecked,
  });

  if (!authChecked) {
    return <div className="billing-loading"><p>Authenticating...</p></div>;
  }

  if (!effectiveUserId && authChecked) {
    return <div className="billing-loading"><p>Session invalid. Redirecting to login...</p></div>;
  }

  if (isLoading) return <div className="billing-loading"><p>Loading billing history...</p></div>;
  if (apiError) return <div className="billing-error"><p>Error loading billing history: {apiError.message || 'Please try again.'}</p></div>;

  return (
    <div className="customer-billing-list-container">
      <header className="billing-list-header">
        <h2>Billing History</h2>
      </header>
      {authError && <p className="error-message">Authentication Error: {authError}</p>}
      {billingHistory && billingHistory.length > 0 ? (
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
              {billingHistory.map((item) => (
                <tr key={item.billingId}>
                  <td>{item.billingId}</td>
                  <td>{item.rideId}</td>
                  <td>{item.date}</td>
                  <td>{item.distanceCovered}</td>
                  <td>{item.amount}</td>
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