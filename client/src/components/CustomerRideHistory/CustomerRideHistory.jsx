import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerRideHistory.css';

const CustomerRideHistory = () => {
  const navigate = useNavigate();

  // Placeholder for authentication check
  const isAuthenticated = true; // Replace with actual authentication logic later

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      navigate('/login-customer');
    }
  }, [isAuthenticated, navigate]);

  const [ridesHistory, setRidesHistory] = useState([
    {
      id: 'R123-45-6789',
      pickupLocation: { latitude: 40.7128, longitude: -74.0060 },
      dropOffLocation: { latitude: 40.7306, longitude: -73.9352 },
      dateTime: 'Apr 12, 2025, 10:00 AM',
      customerId: 'C67890',
      driverId: 'D12345',
      predictedPrice: 25.0,
      actualPrice: 24.5,
      status: 'Completed',
    },
    {
      id: 'R123-45-6790',
      pickupLocation: { latitude: 40.7580, longitude: -73.9855 },
      dropOffLocation: { latitude: 40.7128, longitude: -74.0060 },
      dateTime: 'Apr 8, 2025, 2:00 PM',
      customerId: 'C67890',
      driverId: 'D54321',
      predictedPrice: 20.0,
      actualPrice: 18.75,
      status: 'Pending',
    },
    {
      id: 'R123-45-6791',
      pickupLocation: { latitude: 40.7306, longitude: -73.9352 },
      dropOffLocation: { latitude: 40.7580, longitude: -73.9855 },
      dateTime: 'Apr 2, 2025, 8:00 AM',
      customerId: 'C67890',
      driverId: 'D67890',
      predictedPrice: 35.0,
      actualPrice: 32.2,
      status: 'Cancelled',
    },
  ]);

  const handleCancelRide = (rideId) => {
    // Update the status of the ride to "Cancelled"
    const updatedRides = ridesHistory.map((ride) =>
      ride.id === rideId && ride.status === 'Pending'
        ? { ...ride, status: 'Cancelled' }
        : ride
    );
    setRidesHistory(updatedRides);
    console.log(`Ride ${rideId} has been cancelled.`);
  };

  return (
    <div className="rides-container">
      <header className="rides-header">
        <div className="rides-logo">Uber</div>
        <div className="rides-title">Ride History</div>
      </header>

      <div className="rides-section">
        <h2 className="section-title">Your Rides</h2>
        <table className="rides-table">
          <thead>
            <tr>
              <th>Ride ID</th>
              <th>Pickup Location (Lat, Long)</th>
              <th>Drop Off Location (Lat, Long)</th>
              <th>Date/Time</th>
              <th>Predicted Price ($)</th>
              <th>Actual Price ($)</th>
              <th>Customer ID</th>
              <th>Driver ID</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {ridesHistory.map((ride) => (
              <tr key={ride.id}>
                <td>{ride.id}</td>
                <td>
                  ({ride.pickupLocation.latitude}, {ride.pickupLocation.longitude})
                </td>
                <td>
                  ({ride.dropOffLocation.latitude}, {ride.dropOffLocation.longitude})
                </td>
                <td>{ride.dateTime}</td>
                <td>${ride.predictedPrice.toFixed(2)}</td>
                <td>${ride.actualPrice.toFixed(2)}</td>
                <td>{ride.customerId}</td>
                <td>{ride.driverId}</td>
                <td>
                  <span className={`status ${ride.status.toLowerCase()}`}>
                    {ride.status}
                  </span>
                </td>
                <td>
                  {ride.status === 'Pending' && (
                    <button
                      onClick={() => handleCancelRide(ride.id)}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerRideHistory;
