import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { Link, useNavigate } from 'react-router-dom';
import {
  useGetDriverByIdQuery,
  useSearchRidesQuery,
  useUpdateDriverLocationMutation,
  // useAcceptRideMutation, // This seems to be in RideItemWithFare, not directly here
} from '../../../api/apiSlice';
import useDriverAuth from '../../../hooks/useDriverAuth';
import RideItemWithFare from './RideItemWithFare';
import './DriverDashboard.css';

const KM_TO_MILES = 0.621371;

// Haversine distance calculation (ensure this is the same as in RideItemWithFare or use a shared utility)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }
  const R = 6371; // Radius of the Earth in kilometers
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

const DriverDashboard = () => { // Removed latitude, longitude props as location is handled internally
  const navigate = useNavigate();
  const { userId, authChecked, error: authError } = useDriverAuth('accessToken', '/login-driver');

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState(Infinity); // Infinity for 'All'

  const { data: driverData, error: driverApiError, isLoading: driverLoading } = useGetDriverByIdQuery(userId, {
    skip: !userId || !authChecked,
  });

  const { data: ridesResponse, error: ridesError, isLoading: ridesLoading } = useSearchRidesQuery(
    { status: "REQUESTED", limit: 50 }, // Added limit, adjust as needed
    {
      skip: !userId || !authChecked,
      pollingInterval: 30000, // Optional: Poll for new rides
    }
  );

  const [updateDriverLocation, { isLoading: isUpdatingLocation }] = useUpdateDriverLocationMutation();

  useEffect(() => {
    if (!userId || !authChecked) return;

    let isMounted = true; // To prevent state updates on unmounted component
    let retryTimeoutId = null;

    const attemptToGetLocation = () => {
      // If location is already found, or component unmounted, or no user/auth, stop.
      if (!isMounted || location || !userId || !authChecked) {
        if (retryTimeoutId) clearTimeout(retryTimeoutId);
        return;
      }

      // console.log("Attempting to get location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return;
          const { latitude, longitude } = position.coords;
          // console.log("Location retrieved:", { latitude, longitude });
          setLocation({ latitude, longitude });
          setLocationError(null); // Clear any previous error
          updateDriverLocation({ driverId: userId, latitude, longitude })
            .unwrap()
            .catch(err => {
              if (isMounted) console.error("Failed to update driver location on server (initial fetch):", err);
            });
          // Location found, no need to schedule further retries from here.
        },
        (error) => {
          if (!isMounted) return;
          console.error(`Error getting driver location (attempt): ${error.message}. Retrying in 5s...`);
          setLocationError(error.message); // Show error to user
          // Schedule a retry
          if (isMounted) { // Ensure component is still mounted before setting timeout
            retryTimeoutId = setTimeout(attemptToGetLocation, 5000); // Retry after 5 seconds
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 } // 10s timeout for request, allow cached for 1min
      );
    };

    if (!location) { // Only start the process if location is not yet set
        attemptToGetLocation();
    }

    return () => {
      isMounted = false;
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
        // console.log("Cleared location retry timeout on unmount.");
      }
    };
  }, [userId, authChecked, updateDriverLocation, location]); // Added location to dependency array

  // Calculate rides with distance to pickup (memoized)
  const ridesWithDistance = useMemo(() => {
    if (!ridesResponse?.rides) {
      return [];
    }
    if (!location?.latitude || !location?.longitude) {
      // If driver location is not yet available, map rides without distance or with null distance
      return ridesResponse.rides.map(ride => ({
        ...ride,
        distanceToPickupMi: null, // Explicitly set to null
      }));
    }
    return ridesResponse.rides.map(ride => {
      let distanceToPickupKm = null;
      if (ride.pickupLocation?.coordinates) {
        distanceToPickupKm = calculateDistance(
          location.latitude,
          location.longitude,
          ride.pickupLocation.coordinates[1], // lat
          ride.pickupLocation.coordinates[0]  // lng
        );
      }
      return {
        ...ride,
        distanceToPickupMi: distanceToPickupKm !== null ? distanceToPickupKm * KM_TO_MILES : null,
      };
    });
  }, [ridesResponse, location]); // Removed calculateDistance and KM_TO_MILES as they are stable module-level

  // Filter rides based on selected radius (memoized)
  const filteredRidesToDisplay = useMemo(() => {
    if (selectedRadius === Infinity) {
      return ridesWithDistance; // Show all if "All Distances" or driver location not available
    }
    // If driver location is not available, distanceToPickupMi will be null, so they won't be filtered out by radius
    // but they also won't match any specific radius unless selectedRadius is Infinity.
    return ridesWithDistance.filter(ride =>
      ride.distanceToPickupMi !== null && ride.distanceToPickupMi <= selectedRadius
    );
  }, [ridesWithDistance, selectedRadius]);


  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    navigate('/login-driver');
  };

  if (!authChecked && !authError) {
    return <div className="driver-dashboard-container"><p>Authenticating...</p></div>;
  }
  if (authError) {
    return <div className="driver-dashboard-container error-message"><p>Authentication Error: {authError}. Please <Link to="/login-driver">login</Link>.</p></div>;
  }
  if (driverLoading) {
    return <div className="driver-dashboard-container"><p>Loading driver data...</p></div>;
  }

  return (
    <div className="driver-dashboard-container">
      {driverData ? (
        <h1>Welcome, {driverData.firstName}!</h1>
      ) : driverApiError ? (
        <p className="error-message">Could not load driver details.</p>
      ) : (
        <h1>Welcome to the Driver Dashboard</h1>
      )}
      
      <div className="profile-page-link-container">
        <Link to="/driver/profile" className="nav-button profile-button">View/Edit My Profile</Link>
      </div>

      <div className="location-status">
        <h3>Your Location:</h3>
        {location ? (
          <p>Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}</p>
        ) : locationError ? (
          <p className="error-message">Location Error: {locationError}</p>
        ) : (
          <p>Fetching location...</p>
        )}
        {isUpdatingLocation && <p>Updating location on server...</p>}
      </div>

      <div className="radius-filter">
        <label htmlFor="radius-select">Show rides within: </label>
        <select
          id="radius-select"
          value={selectedRadius === Infinity ? 'all' : selectedRadius}
          onChange={(e) => setSelectedRadius(e.target.value === 'all' ? Infinity : Number(e.target.value))}
          className="radius-dropdown"
        >
          <option value="all">All Distances</option>
          <option value="5">5 miles</option>
          <option value="10">10 miles</option>
          <option value="20">20 miles</option>
          <option value="50">50 miles</option>
        </select>
      </div>

      <div className="requested-rides">
        <h2>Available Ride Requests</h2>
        {ridesLoading && <p>Loading requested rides...</p>}
        {ridesError && <p className="error-message">Error loading rides: {ridesError.data?.message || ridesError.error || 'An unknown error occurred'}</p>}
        
        {filteredRidesToDisplay && filteredRidesToDisplay.length > 0 ? (
          <ul className="rides-list">
            {filteredRidesToDisplay.map((ride) => (
              <RideItemWithFare 
                key={ride._id || ride.id} 
                ride={ride} 
                driverLocation={location} // Pass driver's current location for display in RideItemWithFare
              />
            ))}
          </ul>
        ) : (
          !ridesLoading && !ridesError && <p>No rides currently available within the selected radius.</p>
        )}
      </div>

      <button onClick={handleLogout} className="nav-button logout-button">Logout</button>
    </div>
  );
};

export default DriverDashboard;
