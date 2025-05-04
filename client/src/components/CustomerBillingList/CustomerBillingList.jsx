import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerBillingList.css';

const CustomerBillingList = () => {
  const navigate = useNavigate();

  // Placeholder for authentication check
  const isAuthenticated = true; 

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      navigate('/login-customer');
    }
  }, [isAuthenticated, navigate]);

  const billingHistory = [
    { id: '84729', date: 'Apr 12, 2025', distance: 10, amount: 24.5, status: 'Paid' },
    { id: '84623', date: 'Apr 8, 2025', distance: 5, amount: 18.75, status: 'Paid' },
    { id: '84502', date: 'Apr 2, 2025', distance: 31, amount: 32.2, status: 'Paid' },
    { id: '84321', date: 'Mar 28, 2025', distance: 13, amount: 15.5, status: 'Paid' },
    { id: '84210', date: 'Mar 23, 2025', distance: 1, amount: 27.8, status: 'Paid' },
  ];

  const handleDownloadReceipt = (id) => {
    console.log(`Download receipt for transaction ${id}`);
  };

  return (
    <div className="billing-container">
      <header className="billing-header">
        <div className="billing-logo">Uber</div>
        <div className="billing-title">Billing History</div>
      </header>

      <div className="billing-section">
        <h2 className="section-title">Billing History</h2>
        <table className="billing-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Distance</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {billingHistory.map((transaction) => (
              <tr key={transaction.id}>
                <td>#{transaction.id}</td>
                <td>{transaction.date}</td>
                <td>{transaction.distance}</td>
                <td>${transaction.amount.toFixed(2)}</td>
                <td>
                  <span className="status paid">{transaction.status}</span>
                </td>
                <td>
                  <button
                    onClick={() => handleDownloadReceipt(transaction.id)}
                    className="receipt-button"
                  >
                    Receipt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerBillingList;
