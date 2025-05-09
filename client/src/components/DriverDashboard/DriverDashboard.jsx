import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DriverDashboard.css';
// Optional: If you have a Redux slice for auth state (beyond RTK Query)
// import { useDispatch } from 'react-redux';
// import { setDriverLoggedOut } from '../auth/authSlice'; // Example action

import { useGetDriverByIdQuery, useGetRidesByDriverQuery, useUpdateDriverLocationMutation, useSearchRidesQuery } from '../../api/apiSlice';

const DriverDashboard = ({ userId }) => {
  const navigate = useNavigate();
  // Optional: Get dispatch function if using a separate auth slice
  // const dispatch = useDispatch();

  const { data: driverData, error, isLoading } = useGetDriverByIdQuery(userId);
  // const { data: rides, error: ridesError, isLoading: ridesLoading } = useGetRidesByDriverQuery(userId);
  const { data: rides, error: ridesError, isLoading: ridesLoading } = useSearchRidesQuery({ status: "PENDING" });
  const [updateDriverLocation] = useUpdateDriverLocationMutation();

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(coords);
          console.log("Device location:", coords);

          // Optional: Send to backend
          updateDriverLocation({ id: userId, ...coords });
        },
        (error) => {
          console.error("Geolocation error:", error.message);
          setLocationError(error.message);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocationError("Geolocation not supported by this browser.");
    }
  }, [userId, updateDriverLocation]);
  
  // Get the most recent ride (assumes first is latest)
  const latestRide = rides?.[0];
  const pickup = latestRide?.pickupLocation;

  // Function to handle logout
  const handleLogout = () => {
    // 1. Clear the stored token
    localStorage.removeItem('driverToken');
    console.log('Driver token removed.');

    // 2. Optional: Dispatch action to clear Redux auth state
    // dispatch(setDriverLoggedOut());

    // 3. Optional: Reset RTK Query state if needed (often clearing token is enough)
    // dispatch(apiSlice.util.resetApiState()); // Be cautious, resets ALL API state

    // 4. Redirect to login or home page
    navigate('/'); // Or navigate('/')
  };

  return (
    <div className="driver-dashboard-container">
      <h1>Welcome to the Driver Dashboard</h1>
      <p>This is the dashboard for drivers.</p>
      {isLoading && <p>Loading driver data...</p>}
      {error && <p>Error loading driver data: {error.message}</p>}
      {driverData && (
        <div className="driver-info">
          <h2>Driver Information</h2>
          <p>Name: {driverData.name}</p>
          <p>Email: {driverData.email}</p>
          <p>Phone: {driverData.phone}</p>
          {/* Add more driver information as needed */}
        </div>
      )}

      {ridesLoading && <p>Loading ride data...</p>}
      {ridesError && <p>Error loading ride data: {ridesError.message}</p>}
      {pickup && (
        <div className="customer-location">
          <h3>Customer Pickup Location</h3>
          <p>Latitude: {pickup.latitude}</p>
          <p>Longitude: {pickup.longitude}</p>
        </div>
      )}

      {location && (
        <div className="device-location">
          <h3>Your Current Device Location</h3>
          <p>Latitude: {location.latitude}</p>
          <p>Longitude: {location.longitude}</p>
        </div>
      )}
      {locationError && <p style={{ color: 'red' }}>{locationError}</p>}

      <div className="navigation-buttons">
        <button className="nav-button" onClick={() => navigate('/')}>
          Home
        </button>
        <button className="nav-button" onClick={() => navigate('/driver/manage-rides')}>
          Manage Rides
        </button>
        <button className="nav-button" onClick={() => navigate('/driver/earnings')}>
          Driver Earnings
        </button>
        <button className="nav-button" onClick={() => navigate('/admin/dashboard')}>
          Admin Dashboard
        </button>
        {/* Add Logout Button */}
        <button className="nav-button logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default DriverDashboard;