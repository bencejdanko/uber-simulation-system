import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link
import { 
  useGetDriverByIdQuery, 
  // useUpdateDriverProfileMutation, // No longer needed here
  useUpdateDriverLocationMutation, 
  useSearchRidesQuery 
} from '../../../api/apiSlice';
import useDriverAuth from '../../../hooks/useDriverAuth';
import RideItemWithFare from './RideItemWithFare';
import './DriverDashboard.css';

const DriverDashboard = ({ latitude, longitude }) => {
  const navigate = useNavigate();
  const { userId, authChecked, error: authError } = useDriverAuth('accessToken', '/login-driver');

  // Fetch driver data for welcome message and other potential uses
  const { data: driverData, error: driverApiError, isLoading: driverLoading } = useGetDriverByIdQuery(userId, {
    skip: !userId || !authChecked,
  });

  // Fetch rides with status "REQUESTED"
  const { data: ridesResponse, error: ridesError, isLoading: ridesLoading } = useSearchRidesQuery({ status: "REQUESTED" }, {
    skip: !userId || !authChecked, 
  });

  const [updateDriverLocation] = useUpdateDriverLocationMutation();
  // Removed: updateDriverProfile mutation and related states (isUpdating, updateError)
  // Removed: formData state for profile editing
  // Removed: isEditing state

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Removed: useEffect for populating formData from driverData for editing

  // Removed: handleChange, handleSubmit, handleEdit, handleCancel for profile editing

  // Get current device location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          if (userId) { // Update backend location if userId is available
            updateDriverLocation({ id: userId, latitude, longitude })
              .unwrap()
              .then(() => console.log('Driver location updated on backend'))
              .catch((err) => console.error('Failed to update driver location on backend:', err));
          }
        },
        (error) => {
          console.error("Error getting device location:", error);
          setLocationError(error.message);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, [userId, updateDriverLocation]); // Added userId and updateDriverLocation to dependency array


  const actualRides = ridesResponse?.rides;

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    // dispatch(apiSlice.util.resetApiState()); // If using RTK Query's cache clearing
    navigate('/login-driver');
  };

  if (!authChecked) {
    return <div className="dashboard-loading"><p>Authenticating...</p></div>;
  }
  if (authError) {
    return <div className="dashboard-error"><p>Authentication Error: {typeof authError === 'string' ? authError : JSON.stringify(authError)}</p></div>;
  }
  if (driverLoading && !driverData) { // Show loading only if driverData isn't there yet
    return <div className="dashboard-loading"><p>Loading dashboard...</p></div>;
  }
  if (driverApiError && !driverData) {
    return <div className="dashboard-error"><p>Error loading driver data: {driverApiError.data?.message || driverApiError.error}</p></div>;
  }

  return (
    <div className="driver-dashboard-container">
      {driverData ? (
        <h1>Welcome, {driverData.firstName}!</h1>
      ) : (
        <h1>Welcome to the Driver Dashboard</h1>
      )}
      
      {/* Link to the new Driver Profile Page */}
      <div className="profile-page-link-container">
        <Link to="/driver/profile" className="nav-button profile-button">View/Edit My Profile</Link>
      </div>

      {/* Section to display "REQUESTED" rides */}
      <div className="requested-rides">
        <h2>Requested Rides</h2>
        {ridesLoading && <p>Loading requested rides...</p>}
        {ridesError && <p className="error-message">Error loading rides: {ridesError.data?.message || ridesError.error || 'An unknown error occurred'}</p>}
        {actualRides && actualRides.length > 0 ? (
          <ul className="rides-list">
            {actualRides.map((ride) => (
              <RideItemWithFare key={ride._id || ride.id} ride={ride} />
            ))}
          </ul>
        ) : (
          !ridesLoading && !ridesError && <p>No rides currently requested.</p>
        )}
      </div>

      {location && (
        <div className="device-location">
          <h3>Your Current Device Location</h3>
          <p>Latitude: {location.latitude}</p>
          <p>Longitude: {location.longitude}</p>
        </div>
      )}
      {/* {locationError && <p className="error-message" style={{ color: 'red' }}>Location Error: {locationError}</p>} */} {/* Geolocation error display removed */}

      <div className="navigation-buttons">
        <button className="nav-button" onClick={() => navigate('/')}>Home</button>
        <button className="nav-button" onClick={() => navigate('/driver/manage-rides')}>Manage Rides</button>
        <button className="nav-button" onClick={() => navigate('/driver/earnings')}>Driver Earnings</button>
        {/* Add other relevant dashboard navigation buttons here */}
        <button className="nav-button logout-button" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default DriverDashboard;
