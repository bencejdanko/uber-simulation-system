import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useRequestRideMutation,
  // useGetPricingQuery, // REMOVED: We will use manual fetch
  useSearchRidesQuery,
  useCancelRideMutation,
} from '../../../api/apiSlice';
import LocationSelection from './LocationSelection';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import useCustomerAuth from '../../../hooks/useCustomerAuth';
import './CustomerRequestRide.css';
import './LocationSelection.css';

const containerStyle = {
  width: '100%',
  height: '300px',
  marginTop: '20px',
  marginBottom: '20px',
  borderRadius: '8px',
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance; // Returns distance in km
};

const KM_TO_MILES = 0.621371;
const LIBRARIES = ['places'];
const GOOGLE_MAP_SCRIPT_ID = 'uber-google-maps-script';

const getVehicleTypeForServer = (frontendRideType) => {
  switch (frontendRideType) {
    case 'UberX': return 'STANDARD';
    case 'Comfort': return 'PREMIUM';
    case 'XL': return 'PREMIUM';
    case 'Black': return 'LUXURY';
    default: return undefined;
  }
};

const getVehicleTypeForRideLevel = (frontendRideType) => {
  switch (frontendRideType) {
    case 'UberX': return 0;
    case 'Comfort': return 1;
    case 'XL': return 2;
    case 'Black': return 3;
    default: return 0;
  }
};

const getPaymentMethodForServer = (frontendPaymentMethod) => {
  if (frontendPaymentMethod.toLowerCase().includes('cash')) return 'CASH';
  if (frontendPaymentMethod.includes('Visa') || frontendPaymentMethod.includes('MasterCard') || frontendPaymentMethod.includes('Amex')) return 'CREDIT_CARD';
  return undefined;
};

const CustomerRequestRide = ({ userId: propUserId }) => {
  const navigate = useNavigate();
  const { userId, authChecked, error: authError } = useCustomerAuth('accessToken', '/login-customer');
  const [requestRide, { isLoading: isRequestingRide, error: rideRequestError }] = useRequestRideMutation();
  const [cancelExistingRideMutation, { isLoading: isCancellingRide, error: cancelRideErrorFromMutation }] = useCancelRideMutation(); // Renamed to avoid conflict

  const {
    data: customerRidesData,
    isLoading: isLoadingCustomerRides,
    error: customerRidesError,
    refetch: refetchCustomerRides,
  } = useSearchRidesQuery({ customerId: userId }, {
    skip: !userId || !authChecked,
  });

  const [existingActiveRide, setExistingActiveRide] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAP_SCRIPT_ID,
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [locations, setLocations] = useState({ pickup: null, dropoff: null });
  const [rideOptions] = useState([
    { type: 'UberX', priceRange: '$16–$20', eta: '5 min', capacity: '4 seats' },
    { type: 'Comfort', priceRange: '$18–$23', eta: '6 min', capacity: '4 seats' },
    { type: 'XL', priceRange: '$25–$30', eta: '8 min', capacity: '6 seats' },
    { type: 'Black', priceRange: '$40–$50', eta: '10 min', capacity: '4 seats' },
  ]);
  const [selectedRide, setSelectedRide] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Visa •••• 1234');
  const [availablePaymentMethods] = useState(['Visa •••• 1234', 'MasterCard •••• 5678', 'Amex •••• 9876', 'Uber Cash']);
  const [error, setError] = useState(''); // General form error
  const [rideStatus, setRideStatus] = useState('');
  const [distance, setDistance] = useState('');
  
  // State for manual fare fetching
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [isFetchingFare, setIsFetchingFare] = useState(false);
  const [fetchFareError, setFetchFareError] = useState(null); // Error specific to fare fetching

  const [map, setMap] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(10);

  // REMOVED: skipFareQuery state
  // REMOVED: useGetPricingQuery hook call (lines 145-167 approx in original)

  useEffect(() => {
    if (customerRidesData && Array.isArray(customerRidesData.rides)) {
      const activeRide = customerRidesData.rides.find(
        (ride) => ride.status === 'REQUESTED' || ride.status === 'PENDING'
      );
      setExistingActiveRide(activeRide || null);
    } else {
      setExistingActiveRide(null);
    }
  }, [customerRidesData]);

  const onLoad = useCallback((mapInstance) => setMap(mapInstance), []);
  const onUnmount = useCallback(() => setMap(null), []);

  useEffect(() => {
    if (locations.pickup?.lat && locations.pickup?.lng && locations.dropoff?.lat && locations.dropoff?.lng) {
      const dist = calculateDistance(locations.pickup.lat, locations.pickup.lng, locations.dropoff.lat, locations.dropoff.lng);
      if (dist !== null) {
        const distInMiles = dist * KM_TO_MILES;
        setDistance(`${distInMiles.toFixed(2)} mi`);
      } else {
        setDistance('');
      }
      if (map && window.google && window.google.maps) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(new window.google.maps.LatLng(locations.pickup.lat, locations.pickup.lng));
        bounds.extend(new window.google.maps.LatLng(locations.dropoff.lat, locations.dropoff.lng));
        map.fitBounds(bounds);
        const listener = window.google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom() > 15) map.setZoom(15);
          window.google.maps.event.removeListener(listener);
        });
      }
    } else {
      setDistance('');
      if (locations.pickup?.lat && locations.pickup?.lng) {
        setMapCenter({ lat: locations.pickup.lat, lng: locations.pickup.lng });
        setMapZoom(15);
      } else if (locations.dropoff?.lat && locations.dropoff?.lng) {
        setMapCenter({ lat: locations.dropoff.lat, lng: locations.dropoff.lng });
        setMapZoom(15);
      } else {
        setMapCenter(defaultCenter);
        setMapZoom(10);
      }
    }
  }, [locations, map, isLoaded]);

  // Function to fetch fare manually
  const fetchFareManually = useCallback(async () => {
    setIsFetchingFare(true);
    setFetchFareError(null);
    // setEstimatedFare(null); // Resetting here might cause flicker if conditions briefly become invalid then valid again.
                           // The calling useEffect will handle resetting if inputs are invalid.

    const params = {
      pickupLocation: {
        latitude: locations.pickup?.lat,
        longitude: locations.pickup?.lng,
      },
      dropoffLocation: {
        latitude: locations.dropoff?.lat,
        longitude: locations.dropoff?.lng,
      },
      pickupTimestamp: new Date().toISOString(),
      rideLevel: getVehicleTypeForRideLevel(selectedRide),
      distance: calculateDistance(
        locations.pickup?.lat,
        locations.pickup?.lng,
        locations.dropoff?.lat,
        locations.dropoff?.lng
      ),
    };

    // console.log('[Manual Fetch] Requesting Fare with Params:', params);
    const token = localStorage.getItem('accessToken'); // Assuming token is stored here by useCustomerAuth or login process

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/v1/pricing/actual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }), // Conditionally add Authorization header
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        // console.error('[Manual Fetch] API Error:', data);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // console.log('[Manual Fetch] Fare Data Received:', data);
      if (typeof data.fare === 'number') {
        setEstimatedFare(data.fare);
      } else {
        console.warn("[Manual Fetch] Fare data received, but 'fare' field is missing or not a number:", data);
        setFetchFareError({ message: "Invalid fare data received from server." }); // Store as an object for consistency
      }
    } catch (error) {
      console.error('[Manual Fetch] Fetching fare failed:', error);
      setFetchFareError({ message: error.message || "Failed to fetch fare. Please try again." });
    } finally {
      setIsFetchingFare(false);
    }
  }, [locations.pickup, locations.dropoff, selectedRide]); // Dependencies for useCallback

  // Effect to trigger manual fare fetch when conditions are met
  useEffect(() => {
    const pickupLocationValid =
      locations.pickup &&
      typeof locations.pickup.address === 'string' && locations.pickup.address.trim() !== '' &&
      typeof locations.pickup.lat === 'number' &&
      typeof locations.pickup.lng === 'number';

    const dropoffLocationValid =
      locations.dropoff &&
      typeof locations.dropoff.address === 'string' && locations.dropoff.address.trim() !== '' &&
      typeof locations.dropoff.lat === 'number' &&
      typeof locations.dropoff.lng === 'number';

    if (pickupLocationValid && dropoffLocationValid && selectedRide) {
      // console.log('[Manual Fetch Trigger] Conditions met, fetching fare.');
      fetchFareManually();
    } else {
      // console.log('[Manual Fetch Trigger] Conditions NOT met, resetting fare states.');
      setEstimatedFare(null);
      // setIsFetchingFare(false); // Not strictly needed here as fetchFareManually handles its own loading state
      // setFetchFareError(null); // Also handled by fetchFareManually on new attempt
    }
  }, [locations.pickup, locations.dropoff, selectedRide, fetchFareManually]);

  // REMOVED: useEffect that processed fareData (now part of fetchFareManually)
  // REMOVED: useEffect for [Pricing Query Monitor]

  const handleLocationSelect = (newLocationsUpdater) => {
    if (typeof newLocationsUpdater === 'function') {
      setLocations(newLocationsUpdater);
    } else {
      setLocations(newLocationsUpdater);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) { setError("Authentication error. Please log in again."); return; }
    if (!locations.pickup?.address || !locations.pickup?.lat || !locations.pickup?.lng) { setError('Valid pickup location is required.'); return; }
    if (!locations.dropoff?.address || !locations.dropoff?.lat || !locations.dropoff?.lng) { setError('Valid drop-off location is required.'); return; }
    if (!selectedRide) { setError('Please select a ride option.'); return; }
    if (estimatedFare === null && !isFetchingFare && !fetchFareError) { // Check if fare should have been fetched but isn't
        setError('Please wait for fare estimation or ensure all details are correct.');
        return;
    }
    setError('');

    try {
      const rideDataForServer = {
        customerId: userId,
        pickupLocation: { type: 'Point', coordinates: [locations.pickup.lng, locations.pickup.lat] },
        dropoffLocation: { type: 'Point', coordinates: [locations.dropoff.lng, locations.dropoff.lat] },
        estimatedFare: estimatedFare,
      };
      const vehicleType = getVehicleTypeForServer(selectedRide);
      if (vehicleType) rideDataForServer.vehicleType = vehicleType;
      const serverPaymentMethod = getPaymentMethodForServer(paymentMethod);
      if (serverPaymentMethod) rideDataForServer.paymentMethod = serverPaymentMethod;

      // console.log('Data being sent to server:', rideDataForServer);
      const response = await requestRide(rideDataForServer).unwrap();
      // console.log('Ride requested successfully:', response);
      setRideStatus('pending');
      refetchCustomerRides();
    } catch (err) {
      console.error('Failed to request ride:', err);
      const errorMessage = err.data?.errors
        ? err.data.errors.map(e => `${e.path?.join('.') || 'error'} - ${e.message}`).join(', ')
        : err.data?.message || err.error || 'Failed to request ride. Please try again.';
      setError(errorMessage);
    }
  };

  const handleCancelNewRide = () => {
    // console.log('New ride request cancelled by user before submission or during pending');
    setRideStatus('cancelled');
    setDistance('');
    setEstimatedFare(null);
    setIsFetchingFare(false);
    setFetchFareError(null);
  };

  const handleCancelExistingRide = async (rideId) => {
    if (!rideId) {
      setError("Cannot cancel ride: Ride ID is missing.");
      return;
    }
    setError(''); // Clear general form error
    try {
      await cancelExistingRideMutation(rideId).unwrap();
      // console.log('Existing ride cancelled successfully');
      setExistingActiveRide(null);
      refetchCustomerRides();
    } catch (err) {
      console.error('Failed to cancel existing ride:', err);
      // Use a specific error state for cancellation if preferred, or the general 'error' state
      const errorMessage = err.data?.message || err.error || 'Failed to cancel ride. Please try again.';
      setError(errorMessage); // Or set a specific cancelRideError state
    }
  };
  const handleChangePaymentMethod = (e) => setPaymentMethod(e.target.value);

  if (!authChecked) return <div className="request-ride-loading"><p>Authenticating...</p></div>;
  if (!userId && authChecked) return <div className="request-ride-loading"><p>Session invalid. Redirecting to login...</p></div>;
  if (loadError) { console.error("Google Maps API load error:", loadError); return <div className="request-ride-error"><p>Error loading maps. Please check your API key and internet connection, then refresh.</p></div>; }
  if (!isLoaded) return <div className="request-ride-loading"><p>Loading map...</p></div>;
  if (isLoadingCustomerRides) return <div className="request-ride-loading"><p>Loading your ride information...</p></div>;
  if (customerRidesError) return (<div className="request-ride-error"><p>Error loading your ride information: {customerRidesError.data?.message || customerRidesError.error}</p><button onClick={() => refetchCustomerRides()} className="nav-button">Try Again</button></div>);
  
  if (existingActiveRide) {
    return (
      <div className="request-ride-container existing-ride-details">
        <header className="request-ride-header">
          <div className="request-ride-logo">Uber</div>
          <div className="request-ride-title">Your Active Ride</div>
        </header>
        {error && <p className="error-message" style={{ textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
        {/* Display cancelRideErrorFromMutation if you prefer a separate state for it */}
        {cancelRideErrorFromMutation && <p className="error-message" style={{ textAlign: 'center', marginBottom: '15px' }}>Error cancelling ride: {cancelRideErrorFromMutation.data?.message || cancelRideErrorFromMutation.error}</p>}
        <div className="ride-info">
          <p><strong>Status:</strong> {existingActiveRide.status}</p>
          {existingActiveRide.pickupLocation?.coordinates && (
            <p><strong>Pickup:</strong> Approx. lat: {existingActiveRide.pickupLocation.coordinates[1].toFixed(4)}, lng: {existingActiveRide.pickupLocation.coordinates[0].toFixed(4)}</p>
          )}
          {existingActiveRide.dropoffLocation?.coordinates && (
            <p><strong>Dropoff:</strong> Approx. lat: {existingActiveRide.dropoffLocation.coordinates[1].toFixed(4)}, lng: {existingActiveRide.dropoffLocation.coordinates[0].toFixed(4)}</p>
          )}
          {existingActiveRide.vehicleType && <p><strong>Vehicle Type:</strong> {existingActiveRide.vehicleType}</p>}
        </div>
        <button
          onClick={() => handleCancelExistingRide(existingActiveRide._id)}
          className="cancel-button"
          disabled={isCancellingRide}
        >
          {isCancellingRide ? 'Cancelling...' : 'Cancel Ride'}
        </button>
        <div className="navigation-buttons" style={{ marginTop: '20px' }}>
          <button className="nav-button" onClick={() => navigate('/')}>Home</button>
          <button className="nav-button" onClick={() => navigate('/customer/dashboard')}>Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="request-ride-container">
      <header className="request-ride-header">
        <div className="request-ride-logo">Uber</div>
        <div className="request-ride-title">Request a Ride</div>
      </header>
      {authError && <p className="error-message" style={{ textAlign: 'center', marginBottom: '15px' }}>Authentication Error: {authError}</p>}
      {rideRequestError && <p className="error-message" style={{ textAlign: 'center', marginBottom: '15px' }}>Ride Request Error: {rideRequestError.data?.message || rideRequestError.error}</p>}

      <div className="request-ride-section">
        <h2 className="section-title">Enter Ride Details</h2>
        {error && <div className="error-message">{error}</div>}
        {rideStatus === 'pending' ? (
          <div className="pending-message">
            Your ride is pending. <button onClick={handleCancelNewRide} className="cancel-button">Cancel Ride</button>
          </div>
        ) : rideStatus === 'cancelled' ? (
          <div className="cancelled-message">Your ride has been cancelled.</div>
        ) : (
          <form onSubmit={handleSubmit} className="ride-form">
            <LocationSelection onLocationSelect={handleLocationSelect} />

            {distance && (
              <div className="distance-display">
                <p>Estimated Distance: <strong>{distance}</strong></p>
              </div>
            )}

            <div className="form-group fare-section">
              {isFetchingFare && <p className="fare-loading">Calculating fare...</p>}
              {fetchFareError && (
                <div className="error-message fare-error-details" id="fare-details">
                  <p>Error fetching fare: {fetchFareError.message || 'Could not retrieve fare.'}</p>
                  {/* If fetchFareError.data.errors exists, you can display them similarly to before */}
                </div>
              )}
              {estimatedFare !== null && !isFetchingFare && !fetchFareError && (
                <div className="fare-display" id="fare-details">
                  <p>Estimated Fare: <strong>${estimatedFare.toFixed(2)}</strong></p>
                </div>
              )}
              {!isFetchingFare && !fetchFareError && estimatedFare === null &&
               locations.pickup?.address && locations.dropoff?.address && selectedRide && (
                 <p className="fare-not-available" id="fare-details">Estimated fare is currently unavailable. Please ensure all ride details are complete and correct, or try again.</p>
              )}
            </div>

            <GoogleMap
              mapContainerStyle={containerStyle}
              center={mapCenter}
              zoom={mapZoom}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
            >
              {locations.pickup?.lat && locations.pickup?.lng && (
                <Marker position={{ lat: locations.pickup.lat, lng: locations.pickup.lng }} label="P" />
              )}
              {locations.dropoff?.lat && locations.dropoff?.lng && (
                <Marker position={{ lat: locations.dropoff.lat, lng: locations.dropoff.lng }} label="D" />
              )}
            </GoogleMap>

            <div className="form-group">
              <label>Ride Option</label>
              <select value={selectedRide} onChange={(e) => setSelectedRide(e.target.value)} className="ride-option-dropdown">
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
                <select value={paymentMethod} onChange={handleChangePaymentMethod} className="payment-method-dropdown">
                  {availablePaymentMethods.map((method, index) => (
                    <option key={index} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="submit-button" disabled={isRequestingRide || isFetchingFare}>
              {isRequestingRide ? 'Requesting...' : `Request ${selectedRide || 'Ride'}`}
            </button>
          </form>
        )}
      </div>

      <div className="navigation-buttons">
        <button className="nav-button" onClick={() => navigate('/')}>Home</button>
        <button className="nav-button" onClick={() => navigate('/customer/dashboard')}>Customer Dashboard</button>
        <button className="nav-button" onClick={() => navigate('/customer/ride-history')}>Ride History</button>
      </div>
    </div>
  );
};

export default CustomerRequestRide;