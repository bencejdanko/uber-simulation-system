import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequestRideMutation } from '../../../api/apiSlice';
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

const CustomerRequestRide = () => {
  const navigate = useNavigate();
  const { userId, authChecked, error: authError } = useCustomerAuth('customerToken', '/login-customer');
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

  const [map, setMap] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(10);

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
if (!userId) { // Check userId from hook
        setError("Authentication error. Please log in again.");
        return;
    }
    // ... (existing validations for locations and selectedRide) ...
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
      const rideData = {
customerId: userId, // Add customerId from the hook
        pickup_location: {
          address: locations.pickup.address,
          latitude: locations.pickup.lat,
          longitude: locations.pickup.lng,
        },
        dropoff_location: {
          address: locations.dropoff.address,
          latitude: locations.dropoff.lat,
          longitude: locations.dropoff.lng,
        },
        ride_type: selectedRide,
        payment_method: paymentMethod,
        distance: distance,
      };
      const response = await requestRide(rideData).unwrap();
      console.log('Ride requested successfully:', response);
      setRideStatus('pending');
    } catch (err) {
      console.error('Failed to request ride:', err);
      setError(err.data?.message || err.error || 'Failed to request ride. Please try again.');
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
{authError && <p className="error-message" style={{textAlign: 'center', marginBottom: '15px'}}>Authentication Error: {authError}</p>}
      {rideRequestError && <p className="error-message" style={{textAlign: 'center', marginBottom: '15px'}}>Ride Request Error: {rideRequestError.data?.message || rideRequestError.error}</p>}

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