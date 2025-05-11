import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCustomerAuth from '../../../hooks/useCustomerAuth';
import './Wallet.css';

const Wallet = () => {
  const navigate = useNavigate();
  const { userId, authChecked, error: authError } = useCustomerAuth('accessToken', '/login-customer');

  const paymentMethods = [
    { id: 'visa', type: 'Visa', last4: '4242', expiryDate: '05/26', isDefault: true },
    { id: 'mastercard', type: 'Mastercard', last4: '5555', expiryDate: '08/25', isDefault: false },
    { id: 'amex', type: 'American Express', last4: '3782', expiryDate: '12/24', isDefault: false },
  ];

  const handleSetDefaultPayment = (id) => {
    console.log(`Set payment method ${id} as default`);
  };

  const handleDeletePayment = (id) => {
    console.log(`Delete payment method ${id}`);
  };

  if (!authChecked) {
    return <div className="wallet-loading"><p>Authenticating...</p></div>;
  }

  if (!userId && authChecked) {
    return <div className="wallet-loading"><p>Session invalid. Redirecting to login...</p></div>;
  }

  return (
    <div className="wallet-container">
      <header className="wallet-header">
        <div className="wallet-logo">Uber</div>
        <div className="wallet-title">Payment Methods</div>
      </header>
      {authError && <p className="error-message">Authentication Error: {authError}</p>}

      <div className="wallet-section">
        <h2 className="section-title">Your Payment Methods</h2>
        <div className="payment-methods">
          {paymentMethods.map((method) => (
            <div key={method.id} className="payment-card">
              <div className="payment-info">
                <div className="payment-type">{method.type} •••• {method.last4}</div>
                <div className="payment-expiry">Expires {method.expiryDate}</div>
                {method.isDefault && <div className="payment-default">Default</div>}
              </div>
              <div className="payment-actions">
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefaultPayment(method.id)}
                    className="action-button default"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleDeletePayment(method.id)}
                  className="action-button remove"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="add-payment-button">Add Payment Method</button>
      </div>

      <div className="wallet-navigation">
        <button className="nav-button" onClick={() => navigate('/')}>
          Home
        </button>
        <button className="nav-button" onClick={() => navigate('/customer/dashboard')}>
          Customer Dashboard
        </button>
      </div>
    </div>
  );
};

export default Wallet;