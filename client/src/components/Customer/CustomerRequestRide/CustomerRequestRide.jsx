import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequestRideMutation, useGetEstimatedFareQuery } from '../../../api/apiSlice';
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

const CustomerRequestRide = () => {
  const navigate = useNavigate();
  const { userId, authChecked, error: authError } = useCustomerAuth('accessToken', '/login-customer');
  const [requestRide, { isLoading: isRequestingRide, error: rideRequestError }] = useRequestRideMutation();

  // Call useJsApiLoader at the top level
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
  const [distance, setDistance] = useState(''); // State to store the calculated distance
  const [estimatedFare, setEstimatedFare] = useState(null); // State for estimated fare
  const [skipFareQuery, setSkipFareQuery] = useState(true); // State to control skipping of fare query

  const [map, setMap] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(10);

  // Prepare parameters for the fare query
  const vehicleTypeForFare = getVehicleTypeForServer(selectedRide);
  const {
    data: fareData,
    isLoading: isFareLoading,
    error: fareError,
    refetch: refetchFare // To manually refetch if needed
  } = useGetEstimatedFareQuery(
    {
      pickupLat: locations.pickup?.lat,
      pickupLng: locations.pickup?.lng,
      dropoffLat: locations.dropoff?.lat,
      dropoffLng: locations.dropoff?.lng,
      vehicleType: vehicleTypeForFare,
    },
    { skip: skipFareQuery } // Skip initially and when parameters are not ready
  );

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
      setDistance(''); // Clear distance if not all points are set
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
  }, [locations, map, isLoaded]); // Added isLoaded here as map operations might depend on it

  // Effect to control fare query skipping and update estimated fare
  useEffect(() => {
    if (
      locations.pickup?.lat &&
      locations.pickup?.lng &&
      locations.dropoff?.lat &&
      locations.dropoff?.lng &&
      selectedRide &&
      getVehicleTypeForServer(selectedRide) // Ensure vehicle type is valid for server
    ) {
      setSkipFareQuery(false); // Enable the query
    } else {
      setSkipFareQuery(true); // Disable the query
      setEstimatedFare(null); // Reset fare if inputs are incomplete
    }
  }, [locations.pickup, locations.dropoff, selectedRide]);

  useEffect(() => {
    if (fareData) {
      if (typeof fareData.estimatedFare === 'number') {
        setEstimatedFare(fareData.estimatedFare);
      } else {
        // fareData is present, but estimatedFare is not a number (or missing)
        setEstimatedFare(null); // Set to null to prevent .toFixed errors
        if (fareData.hasOwnProperty('estimatedFare')) {
          // If the key exists but value is not a number
          console.warn(
            `Estimated fare data received, but 'estimatedFare' is not a number:`,
            fareData.estimatedFare
          );
        } else {
          // If the key 'estimatedFare' is missing from fareData
          console.warn(
            "Estimated fare data received, but 'estimatedFare' field is missing."
          );
        }
      }
    } else if (!isFareLoading && !skipFareQuery && !fareError) {
      // If no fareData, not loading, query was attempted, and no error reported by the hook,
      // it implies a successful response with no data or an issue not caught as an error.
      // Ensure estimatedFare is null.
      setEstimatedFare(null);
    }
    // If skipFareQuery is true, another useEffect handles setting estimatedFare to null.
    // If isFareLoading is true, we wait for data or error.
    // If fareError is true, we expect fareError object to be populated and handled by UI.
  }, [fareData, isFareLoading, skipFareQuery, fareError]); // Added fareError to dependencies

  const handleLocationSelect = (newLocationsUpdater) => {
    if (typeof newLocationsUpdater === 'function') {
      setLocations(newLocationsUpdater);
    } else {
      setLocations(newLocationsUpdater);
    }
  };

  useEffect(() => {
    // This useEffect is just for logging, can be removed
    // console.log('Locations state updated in CustomerRequestRide:', locations);
  }, [locations]);

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
      // Transform data to match server schema
      const rideDataForServer = {
        customerId: userId,
        pickupLocation: {
          type: 'Point',
          coordinates: [locations.pickup.lng, locations.pickup.lat], // [longitude, latitude]
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [locations.dropoff.lng, locations.dropoff.lat], // [longitude, latitude]
        },
      };

      const vehicleType = getVehicleTypeForServer(selectedRide);
      if (vehicleType) {
        rideDataForServer.vehicleType = vehicleType;
      }

      const serverPaymentMethod = getPaymentMethodForServer(paymentMethod);
      if (serverPaymentMethod) {
        rideDataForServer.paymentMethod = serverPaymentMethod;
      }

      // Note: 'distance' is removed as it's not in createRideSchema
      // Note: 'address' for pickup/dropoff is not sent as it's not in coordinateSchema

      console.log('Data being sent to server:', rideDataForServer); // For debugging

      const response = await requestRide(rideDataForServer).unwrap();
      console.log('Ride requested successfully:', response);
      setRideStatus('pending');
    } catch (err) {
      console.error('Failed to request ride:', err);
      const errorMessage = err.data?.errors // Zod errors often come in an 'errors' array
        ? err.data.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')
        : err.data?.message || err.error || 'Failed to request ride. Please try again.';
      setError(errorMessage);
    }
  };

  const handleCancel = () => {
    console.log('Ride cancelled');
    setRideStatus('cancelled');
    setDistance(''); // Clear distance on cancel
  };

  const handleChangePaymentMethod = (e) => {
    setPaymentMethod(e.target.value);
  };

  // Conditional returns for auth now come AFTER all hook calls
  if (!authChecked) {
    return <div className="request-ride-loading"><p>Authenticating...</p></div>;
  }

  if (!userId && authChecked) { // authChecked is true, but no userId (hook should have redirected)
    return <div className="request-ride-loading"><p>Session invalid. Redirecting to login...</p></div>;
  }

  // Conditional returns for map loading
  if (loadError) {
    console.error("Google Maps API load error:", loadError);
    return <div className="request-ride-error"><p>Error loading maps. Please check your API key and internet connection, then refresh.</p></div>;
  }

  if (!isLoaded) {
    return <div className="request-ride-loading"><p>Loading map...</p></div>;
  }

  // If we reach here, auth is checked, userId exists, and map script is loaded.
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
            Your ride is pending. <button onClick={handleCancel} className="cancel-button">Cancel Ride</button>
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

            {/* Display Estimated Fare */}
            <div className="form-group fare-section">
              <label className="form-label" htmlFor="fare-details">Estimated Fare</label> {/* Assuming form-label class exists or add styles, added htmlFor */}
              {isFareLoading && <p className="fare-loading">Calculating fare...</p>}
              {fareError && (
                <div className="error-message fare-error-details" id="fare-details"> {/* Changed to div for potentially multi-line content */}
                  <p>Error fetching fare: {fareError.data?.message || fareError.error || 'Could not retrieve fare.'}</p>
                  {/* More detailed Zod-like error display */}
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
              {/* Message for when fare is not available after an attempt */}
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