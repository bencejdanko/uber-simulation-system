import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useRequestRideMutation,
  useGetEstimatedFareQuery,
  useSearchRidesQuery, // Changed from useGetRidesByCustomerQuery
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

// Helper function to calculate distance using Haversine formula
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

// Define libraries array outside the component
const LIBRARIES = ['places'];
const GOOGLE_MAP_SCRIPT_ID = 'uber-google-maps-script'; // Define a static ID

// Helper function to map frontend ride types to backend vehicle types
const getVehicleTypeForServer = (frontendRideType) => {
  switch (frontendRideType) {
    case 'UberX':
      return 'STANDARD';
    case 'Comfort':
      return 'PREMIUM';
    case 'XL':
      return 'PREMIUM'; // Or 'LUXURY' depending on your business logic
    case 'Black':
      return 'LUXURY';
    default:
      return undefined; // Or a default like 'STANDARD' if always required by backend
    // but schema says optional
  }
};

// Helper function to map frontend payment display to backend payment method enum
const getPaymentMethodForServer = (frontendPaymentMethod) => {
  if (frontendPaymentMethod.toLowerCase().includes('cash')) {
    return 'CASH';
  }
  // Assuming any card-like string means CREDIT_CARD
  if (frontendPaymentMethod.includes('Visa') || frontendPaymentMethod.includes('MasterCard') || frontendPaymentMethod.includes('Amex')) {
    return 'CREDIT_CARD';
  }
  return undefined; // Or a default if needed, but schema says optional
};

const CustomerRequestRide = ({ userId: propUserId }) => {
  const navigate = useNavigate();
  const { userId, authChecked, error: authError } = useCustomerAuth('accessToken', '/login-customer');
  const [requestRide, { isLoading: isRequestingRide, error: rideRequestError }] = useRequestRideMutation();
  const [cancelExistingRideMutation, { isLoading: isCancellingRide, error: cancelRideError }] = useCancelRideMutation();

  // Fetch existing rides for the customer
  const {
    data: customerRidesData,
    isLoading: isLoadingCustomerRides,
    error: customerRidesError,
    refetch: refetchCustomerRides,
  } = useSearchRidesQuery({ customerId: userId }, { // Changed to useSearchRidesQuery
    skip: !userId || !authChecked,
  });

  const [existingActiveRide, setExistingActiveRide] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAP_SCRIPT_ID,
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [locations, setLocations] = useState({
    pickup: null,
    dropoff: null
  });
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
  const [rideStatus, setRideStatus] = useState('');
  const [distance, setDistance] = useState('');
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [skipFareQuery, setSkipFareQuery] = useState(true);

  const [map, setMap] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(10);

  const vehicleTypeForFare = getVehicleTypeForServer(selectedRide);
  const {
    data: fareData,
    isLoading: isFareLoading,
    error: fareError,
    refetch: refetchFare
  } = useGetEstimatedFareQuery(
    {
      pickupLat: locations.pickup?.lat,
      pickupLng: locations.pickup?.lng,
      dropoffLat: locations.dropoff?.lat,
      dropoffLng: locations.dropoff?.lng,
      vehicleType: vehicleTypeForFare,
    },
    { skip: skipFareQuery }
  );

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

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  useEffect(() => {
    if (locations.pickup?.lat && locations.pickup?.lng && locations.dropoff?.lat && locations.dropoff?.lng) {
      const dist = calculateDistance(
        locations.pickup.lat,
        locations.pickup.lng,
        locations.dropoff.lat,
        locations.dropoff.lng
      );
      if (dist !== null) {
        const distInMiles = dist * KM_TO_MILES;
        setDistance(`${distInMiles.toFixed(2)} mi`);
      } else {
        setDistance('');
      }

      if (map) {
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

  useEffect(() => {
    if (
      locations.pickup?.lat &&
      locations.pickup?.lng &&
      locations.dropoff?.lat &&
      locations.dropoff?.lng &&
      selectedRide &&
      getVehicleTypeForServer(selectedRide)
    ) {
      setSkipFareQuery(false);
    } else {
      setSkipFareQuery(true);
      setEstimatedFare(null);
    }
  }, [locations.pickup, locations.dropoff, selectedRide]);

  useEffect(() => {
    if (fareData) {
      console.log('Full fareData response:', fareData);
      if (typeof fareData.fare === 'number') {
        setEstimatedFare(fareData.fare);
      } else {
        setEstimatedFare(null);
        if (fareData.hasOwnProperty('estimatedFare')) {
          console.warn(
            `Estimated fare data received, but 'estimatedFare' is not a number:`,
            fareData.estimatedFare
          );
        } else {
          console.warn(
            "Estimated fare data received, but 'estimatedFare' field is missing."
          );
        }
      }
    } else if (!isFareLoading && !skipFareQuery && !fareError) {
      setEstimatedFare(null);
    }
  }, [fareData, isFareLoading, skipFareQuery, fareError]);

  const handleLocationSelect = (newLocationsUpdater) => {
    if (typeof newLocationsUpdater === 'function') {
      setLocations(newLocationsUpdater);
    } else {
      setLocations(newLocationsUpdater);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError("Authentication error. Please log in again.");
      return;
    }
    if (!locations.pickup?.address || !locations.pickup?.lat || !locations.pickup?.lng) {
      setError('Valid pickup location is required.');
      return;
    }
    if (!locations.dropoff?.address || !locations.dropoff?.lat || !locations.dropoff?.lng) {
      setError('Valid drop-off location is required.');
      return;
    }
    if (!selectedRide) {
      setError('Please select a ride option.');
      return;
    }
    setError('');

    try {
      const rideDataForServer = {
        customerId: userId,
        pickupLocation: {
          type: 'Point',
          coordinates: [locations.pickup.lng, locations.pickup.lat],
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [locations.dropoff.lng, locations.dropoff.lat],
        },
        estimatedFare: estimatedFare,
      };

      const vehicleType = getVehicleTypeForServer(selectedRide);
      if (vehicleType) {
        rideDataForServer.vehicleType = vehicleType;
      }

      const serverPaymentMethod = getPaymentMethodForServer(paymentMethod);
      if (serverPaymentMethod) {
        rideDataForServer.paymentMethod = serverPaymentMethod;
      }

      console.log('Data being sent to server:', rideDataForServer);

      const response = await requestRide(rideDataForServer).unwrap();
      console.log('Ride requested successfully:', response);
      setRideStatus('pending');
      refetchCustomerRides();
    } catch (err) {
      console.error('Failed to request ride:', err);
      const errorMessage = err.data?.errors
        ? err.data.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')
        : err.data?.message || err.error || 'Failed to request ride. Please try again.';
      setError(errorMessage);
    }
  };

  const handleCancelNewRide = () => {
    console.log('New ride request cancelled by user before submission or during pending');
    setRideStatus('cancelled');
    setDistance('');
  };

  const handleCancelExistingRide = async (rideId) => {
    if (!rideId) {
      setError("Cannot cancel ride: Ride ID is missing.");
      return;
    }
    setError('');
    try {
      await cancelExistingRideMutation(rideId).unwrap();
      console.log('Existing ride cancelled successfully');
      setExistingActiveRide(null);
      refetchCustomerRides();
    } catch (err) {
      console.error('Failed to cancel existing ride:', err);
      const errorMessage = err.data?.message || err.error || 'Failed to cancel ride. Please try again.';
      setError(errorMessage);
    }
  };

  const handleChangePaymentMethod = (e) => {
    setPaymentMethod(e.target.value);
  };

  if (!authChecked) {
    return <div className="request-ride-loading"><p>Authenticating...</p></div>;
  }

  if (!userId && authChecked) {
    return <div className="request-ride-loading"><p>Session invalid. Redirecting to login...</p></div>;
  }

  if (loadError) {
    console.error("Google Maps API load error:", loadError);
    return <div className="request-ride-error"><p>Error loading maps. Please check your API key and internet connection, then refresh.</p></div>;
  }

  if (!isLoaded) {
    return <div className="request-ride-loading"><p>Loading map...</p></div>;
  }

  if (isLoadingCustomerRides) {
    return <div className="request-ride-loading"><p>Loading your ride information...</p></div>;
  }

  if (customerRidesError) {
    return (
      <div className="request-ride-error">
        <p>Error loading your ride information: {customerRidesError.data?.message || customerRidesError.error}</p>
        <button onClick={() => refetchCustomerRides()} className="nav-button">Try Again</button>
      </div>
    );
  }

  if (existingActiveRide) {
    return (
      <div className="request-ride-container existing-ride-details">
        <header className="request-ride-header">
          <div className="request-ride-logo">Uber</div>
          <div className="request-ride-title">Your Active Ride</div>
        </header>
        {error && <p className="error-message" style={{ textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
        {cancelRideError && <p className="error-message" style={{ textAlign: 'center', marginBottom: '15px' }}>Error cancelling ride: {cancelRideError.data?.message || cancelRideError.error}</p>}
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
              <label className="form-label" htmlFor="fare-details">Estimated Fare</label>
              {isFareLoading && <p className="fare-loading">Calculating fare...</p>}
              {fareError && (
                <div className="error-message fare-error-details" id="fare-details">
                  <p>Error fetching fare: {fareError.data?.message || fareError.error || 'Could not retrieve fare.'}</p>
                  {fareError.data?.errors && Array.isArray(fareError.data.errors) && fareError.data.errors.length > 0 && (
                    <ul style={{ marginTop: '5px', fontSize: '0.9em', paddingLeft: '20px' }}>
                      {fareError.data.errors.map((err, index) => (
                        <li key={index}>{`${err.path?.join('.')} - ${err.message}`}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {!isFareLoading && !fareError && estimatedFare !== null && (
                <div className="fare-display" id="fare-details">
                  <p>Estimated Fare: <strong>${estimatedFare.toFixed(2)}</strong></p>
                </div>
              )}
              {!isFareLoading && !fareError && estimatedFare === null && !skipFareQuery && (
                 <p className="fare-not-available" id="fare-details">Estimated fare is currently unavailable. Please ensure all ride details are complete and correct.</p>
              )}
            </div>

            <GoogleMap
              mapContainerStyle={containerStyle}
              center={mapCenter}
              zoom={mapZoom}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
              }}
            >
              {locations.pickup && locations.pickup.lat && locations.pickup.lng && (
                <Marker
                  position={{ lat: locations.pickup.lat, lng: locations.pickup.lng }}
                  label="P"
                />
              )}
              {locations.dropoff && locations.dropoff.lat && locations.dropoff.lng && (
                <Marker
                  position={{ lat: locations.dropoff.lat, lng: locations.dropoff.lng }}
                  label="D"
                />
              )}
            </GoogleMap>

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
          Ride History
        </button>
      </div>
    </div>
  );
};

export default CustomerRequestRide;