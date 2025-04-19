import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerRequestRide.css';

const CustomerRequestRide = () => {
  const navigate = useNavigate();

  const [pickupLocation, setPickupLocation] = useState({ latitude: '', longitude: '' });
  const [dropoffLocation, setDropoffLocation] = useState({ latitude: '', longitude: '' });
  const [rideOptions] = useState([
    { type: 'UberX', priceRange: '$16–$20', eta: '5 min', capacity: '4 seats' },
    { type: 'Comfort', priceRange: '$18–$23', eta: '6 min', capacity: '4 seats' },
    { type: 'XL', priceRange: '$25–$30', eta: '8 min', capacity: '6 seats' },
    { type: 'Black', priceRange: '$40–$50', eta: '10 min', capacity: '4 seats' },
  ]);
  const [selectedRide, setSelectedRide] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Visa •••• 1234');
  const [availablePaymentMethods] = useState([
    'Visa •••• 1234',
    'MasterCard •••• 5678',
    'Amex •••• 9876',
    'Uber Cash',
  ]);
  const [error, setError] = useState('');
  const [rideStatus, setRideStatus] = useState(''); // 'pending', 'requested', or 'cancelled'

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate input
    if (!pickupLocation.latitude || !pickupLocation.longitude) {
      setError('Pickup location is required.');
      return;
    }
    if (!dropoffLocation.latitude || !dropoffLocation.longitude) {
      setError('Drop-off location is required.');
      return;
    }
    if (!selectedRide) {
      setError('Please select a ride option.');
      return;
    }

    // Clear error and simulate ride request
    setError('');
    console.log('Ride requested:', { pickupLocation, dropoffLocation, selectedRide, paymentMethod });
    setRideStatus('pending');
  };

  const handleCancel = () => {
    console.log('Ride cancelled');
    setRideStatus('cancelled');
  };

  const handleChangePaymentMethod = (e) => {
    setPaymentMethod(e.target.value);
  };

  return (
    <div className="request-ride-container">
      <header className="request-ride-header">
        <div className="request-ride-logo">Uber</div>
        <div className="request-ride-title">Request a Ride</div>
      </header>

      <div className="request-ride-section">
        <h2 className="section-title">Enter Ride Details</h2>
        {error && <div className="error-message">{error}</div>}
        {rideStatus === 'pending' ? (
          <div className="pending-message">
            Your ride is pending. <button onClick={handleCancel} className="cancel-button">Cancel Ride</button>
          </div>
        ) : rideStatus === 'cancelled' ? (
          <div className="cancelled-message">Your ride has been cancelled.</div>
        ) : (
          <form onSubmit={handleSubmit} className="ride-form">
            <div className="form-group">
              <label>Pickup Location</label>
              <input
                type="number"
                placeholder="Latitude"
                value={pickupLocation.latitude}
                onChange={(e) =>
                  setPickupLocation({ ...pickupLocation, latitude: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Longitude"
                value={pickupLocation.longitude}
                onChange={(e) =>
                  setPickupLocation({ ...pickupLocation, longitude: e.target.value })
                }
              />
              <button type="button" className="map-pin-button">Pin on Map</button>
            </div>

            <div className="form-group">
              <label>Drop-off Location</label>
              <input
                type="number"
                placeholder="Latitude"
                value={dropoffLocation.latitude}
                onChange={(e) =>
                  setDropoffLocation({ ...dropoffLocation, latitude: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Longitude"
                value={dropoffLocation.longitude}
                onChange={(e) =>
                  setDropoffLocation({ ...dropoffLocation, longitude: e.target.value })
                }
              />
              <button type="button" className="map-pin-button">Pin on Map</button>
            </div>

            <div className="form-group">
              <label>Ride Option</label>
              <select
                value={selectedRide}
                onChange={(e) => setSelectedRide(e.target.value)}
                className="ride-option-dropdown"
              >
                <option value="">Select a Ride Option</option>
                {rideOptions.map((option) => (
                  <option key={option.type} value={option.type}>
                    {option.type} - {option.priceRange} - {option.eta} - {option.capacity}
                  </option>
                ))}
              </select>
            </div>

            <div className="payment-method">
              <h3>Payment Method</h3>
              <div className="payment-details">
                <select
                  value={paymentMethod}
                  onChange={handleChangePaymentMethod}
                  className="payment-method-dropdown"
                >
                  {availablePaymentMethods.map((method, index) => (
                    <option key={index} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="submit-button">
              Request {selectedRide || 'Ride'}
            </button>
          </form>
        )}
      </div>

      <div className="navigation-buttons">
        <button className="nav-button" onClick={() => navigate('/')}>
          Home
        </button>
        <button className="nav-button" onClick={() => navigate('/customer/dashboard')}>
          Customer Dashboard
        </button>
        <button className="nav-button" onClick={() => navigate('/customer/ride-history')}>
          Customer Ride History
        </button>
        <button className="nav-button" onClick={() => navigate('/customer/billing-list')}>
          Customer Billing
        </button>
      </div>
    </div>
  );
};

export default CustomerRequestRide;