// DriverRidesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from './apiClient'; // Your pre-configured Axios or fetch wrapper

const DRIVER_ID = "driver-ssn-from-auth"; // Replace with actual driver ID from auth state
const LOCATION_UPDATE_INTERVAL = 30000; // 30 seconds
const RIDE_REQUEST_FETCH_INTERVAL = 15000; // 15 seconds

function DriverRidesPage() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [availableRides, setAvailableRides] = useState([]);
  const [acceptedRide, setAcceptedRide] = useState(null); // Details of the ride the driver accepted
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Update Driver's Location Periodically
  const updateDriverLocation = useCallback(async (location) => {
    if (!location) return;
    try {
      // API Call: PATCH /api/v1/drivers/{driver_id}/location
      await apiClient.patch(`/drivers/${DRIVER_ID}/location`, {
        latitude: location.latitude,
        longitude: location.longitude,
      });
      console.log("Driver location updated:", location);
    } catch (err) {
      console.error("Failed to update driver location:", err);
      // Handle error appropriately, maybe a silent retry or notification
    }
  }, []);

  useEffect(() => {
    // Get initial location & start watching
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCurrentLocation(newLocation);
        updateDriverLocation(newLocation); // Update immediately on change
      },
      (err) => {
        console.error("Error getting geolocation:", err);
        setError("Could not get your location. Please enable location services.");
      }
    );

    // Fallback or regular interval update if watchPosition doesn't fire often enough for your needs
    // or if you want to ensure updates even if position hasn't "changed" significantly
    const intervalId = setInterval(() => {
        if (currentLocation) {
            updateDriverLocation(currentLocation);
        }
    }, LOCATION_UPDATE_INTERVAL);


    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(intervalId);
    };
  }, [updateDriverLocation, currentLocation]); // Add currentLocation to dependencies if using it in the interval callback

  // 2. Fetch Available Ride Requests Periodically (if not currently on a ride)
  const fetchAvailableRides = useCallback(async () => {
    if (acceptedRide) return; // Don't fetch new rides if already on one

    setIsLoading(true);
    setError(null);
    try {
      // API Call: GET /api/v1/rides?status=REQUESTED
      // Ideally, this would also take lat/lng/radius to filter server-side
      const response = await apiClient.get('/rides?status=REQUESTED');
      setAvailableRides(response.data || []); // Assuming response.data is an array of Ride Objects
    } catch (err) {
      console.error("Failed to fetch available rides:", err);
      setError("Could not fetch available rides. Please try again.");
      setAvailableRides([]);
    } finally {
      setIsLoading(false);
    }
  }, [acceptedRide]);

  useEffect(() => {
    if (!acceptedRide) {
        fetchAvailableRides(); // Initial fetch
        const intervalId = setInterval(fetchAvailableRides, RIDE_REQUEST_FETCH_INTERVAL);
        return () => clearInterval(intervalId);
    }
  }, [fetchAvailableRides, acceptedRide]);

  // 3. Handle Accepting a Ride
  const handleAcceptRide = async (rideId) => {
    setIsLoading(true);
    setError(null);
    try {
      // API Call: POST /api/v1/rides/{ride_id}/accept (Implied/Needed)
      // The backend should use the authenticated driver's ID
      const response = await apiClient.post(`/rides/${rideId}/accept`);
      setAcceptedRide(response.data); // Assuming response.data is the updated Ride Object
      setAvailableRides([]); // Clear available rides as we've accepted one
      console.log("Ride accepted:", response.data);
      // Navigate to a "Current Ride Details" view or update UI
    } catch (err) {
      console.error("Failed to accept ride:", err);
      setError(err.response?.data?.message || "Could not accept ride. It might have been taken or cancelled.");
      fetchAvailableRides(); // Refresh list in case this ride is gone
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Fetch details of an accepted ride (e.g., for polling updates or if page reloads)
  const fetchAcceptedRideDetails = useCallback(async (rideId) => {
    setIsLoading(true);
    try {
        // API Call: GET /api/v1/rides/{ride_id}
        const response = await apiClient.get(`/rides/${rideId}`);
        setAcceptedRide(response.data);
    } catch (err) {
        console.error("Failed to fetch accepted ride details:", err);
        setError("Could not fetch details for the current ride.");
        setAcceptedRide(null); // Clear if error, driver might need to find new rides
    } finally {
        setIsLoading(false);
    }
  }, []);

  // Example: if acceptedRide has an ID but not full details, or for polling
  useEffect(() => {
    if (acceptedRide && acceptedRide.rideId && !acceptedRide.fullDetailsLoaded) { // Add a flag or check fields
        // fetchAcceptedRideDetails(acceptedRide.rideId);
        // Or set up polling for status updates on the acceptedRide
        // const rideStatusInterval = setInterval(() => fetchAcceptedRideDetails(acceptedRide.rideId), 10000);
        // return () => clearInterval(rideStatusInterval);
    }
  }, [acceptedRide, fetchAcceptedRideDetails]);


  // UI Rendering Logic
  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (acceptedRide) {
    return (
      <div>
        <h2>Current Ride</h2>
        <p>Ride ID: {acceptedRide.rideId}</p>
        <p>Status: {acceptedRide.status}</p>
        <p>Pickup: {acceptedRide.pickupLocation.addressLine || `${acceptedRide.pickupLocation.latitude}, ${acceptedRide.pickupLocation.longitude}`}</p>
        <p>Dropoff: {acceptedRide.dropoffLocation.addressLine || `${acceptedRide.dropoffLocation.latitude}, ${acceptedRide.dropoffLocation.longitude}`}</p>
        {/* Add buttons for "Arrived at Pickup", "Start Ride", "End Ride" which would call other (conceptual) API endpoints */}
        <button onClick={() => setAcceptedRide(null)}>Look for other rides (temp)</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Available Rides</h2>
      {isLoading && <p>Loading rides...</p>}
      {currentLocation && <p>Your location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}</p>}
      {!availableRides.length && !isLoading && <p>No ride requests currently available near you.</p>}
      <ul>
        {availableRides.map((ride) => (
          <li key={ride.rideId}>
            <p>Ride ID: {ride.rideId}</p>
            <p>From: {ride.pickupLocation.addressLine || `${ride.pickupLocation.latitude}, ${ride.pickupLocation.longitude}`}</p>
            <p>To: {ride.dropoffLocation.addressLine || `${ride.dropoffLocation.latitude}, ${ride.dropoffLocation.longitude}`}</p>
            <p>Predicted Fare: ${ride.predictedFare?.toFixed(2)}</p>
            <button onClick={() => handleAcceptRide(ride.rideId)} disabled={isLoading}>
              Accept Ride
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DriverRidesPage;