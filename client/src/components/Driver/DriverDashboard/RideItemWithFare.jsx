import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { 
  useGetPricingQuery, // Updated from useGetEstimatedFareQuery
  useGetCustomerByIdQuery,
  useUpdateRideMutation 
} from '../../../api/apiSlice'; 

// --- IMPORTANT ---
// Replace with your actual API key and endpoint for reverse geocoding
const GEOCODING_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;  // Store this in an environment variable
const REVERSE_GEOCODING_ENDPOINT = `https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key=${GEOCODING_API_KEY}`;
// Example for Google: `https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key=YOUR_API_KEY`
// Adjust the endpoint and response parsing based on your chosen geocoding service.

// Helper function to convert degrees to radians
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Haversine distance calculation
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) { // Added null check
    return null;
  }
  const R = 6371; // Radius of the Earth in kilometers
  // const R = 3958.8; // Radius of the Earth in miles

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1); 

  lat1 = toRadians(lat1);
  lat2 = toRadians(lat2);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return distance; // Returns distance in kilometers
  // To return in miles:
  // const distanceMiles = distance * 0.621371;
  // return distanceMiles;
};

const KM_TO_MILES_CONVERSION_FACTOR = 0.621371;


const RideItemWithFare = ({ ride, driverLocation }) => { // Added driverLocation prop
  // Log the incoming ride object
  // console.log(`RideItemWithFare - Ride ID: ${ride._id || ride.id}`, ride);
  // console.log(`RideItemWithFare - Driver Location:`, driverLocation);

  // Fetch customer details
  const { data: customerData, error: customerError, isLoading: customerLoading } = useGetCustomerByIdQuery(ride.customerId, {
    skip: !ride.customerId, // Skip if customerId is not present in the ride object
  });

  const [updateRide, { isLoading: isAcceptingRide, error: acceptRideError }] = useUpdateRideMutation();

  // State for addresses
  const [pickupAddress, setPickupAddress] = useState('Loading address...');
  const [dropoffAddress, setDropoffAddress] = useState('Loading address...');
  const [pickupAddressError, setPickupAddressError] = useState(null);
  const [dropoffAddressError, setDropoffAddressError] = useState(null);

  // Calculate ride distance in KM (for the pricing API) and in MI (for display)
  const { rideDistanceKm, rideDistanceMi } = useMemo(() => {
    if (ride.pickupLocation?.coordinates && ride.dropoffLocation?.coordinates) {
      const [pickupLng, pickupLat] = ride.pickupLocation.coordinates;
      const [dropoffLng, dropoffLat] = ride.dropoffLocation.coordinates;
      
      // console.log(`Calculating ride distance for Ride ID: ${ride._id}. Pickup: [${pickupLng}, ${pickupLat}], Dropoff: [${dropoffLng}, ${dropoffLat}]`);

      const distKm = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
      if (distKm === null) return { rideDistanceKm: null, rideDistanceMi: 'N/A' };
      
      const distMi = distKm * KM_TO_MILES_CONVERSION_FACTOR; 
      return { rideDistanceKm: distKm, rideDistanceMi: `${distMi.toFixed(2)} mi` };
    }
    return { rideDistanceKm: null, rideDistanceMi: 'N/A' };
  }, [ride.pickupLocation?.coordinates, ride.dropoffLocation?.coordinates]);

  // Prepare parameters for useGetPricingQuery
  const fareQueryParams = useMemo(() => {
    if (
      ride.pickupLocation &&
      ride.dropoffLocation &&
      ride.createdAt && // Assuming createdAt is the pickupTimestamp
      ride.vehicleType &&
      rideDistanceKm !== null
    ) {
      return {
        pickupLocation: ride.pickupLocation, // Already { type: 'Point', coordinates: [lng, lat] }
        dropoffLocation: ride.dropoffLocation, // Already { type: 'Point', coordinates: [lng, lat] }
        pickupTimestamp: ride.createdAt, // Or new Date().toISOString() for a new request
        rideLevel: ride.vehicleType,
        distance: rideDistanceKm, // Distance in KM
      };
    }
    return null;
  }, [
    ride.pickupLocation,
    ride.dropoffLocation,
    ride.createdAt,
    ride.vehicleType,
    rideDistanceKm,
  ]);

  const shouldSkipFareQuery = !fareQueryParams;

  // console.log(`RideItemWithFare - Fare Query Params for Ride ID ${ride._id || ride.id}: `, fareQueryParams);
  // console.log(`RideItemWithFare - Should skip Fare Query for Ride ID ${ride._id || ride.id}?`, shouldSkipFareQuery);


  const { 
    data: fetchedFareData, 
    error: fetchedFareError, 
    isLoading: isFetchingFare 
  } = useGetPricingQuery(fareQueryParams, {
    skip: shouldSkipFareQuery,
  });
  
  // console.log(`RideItemWithFare - Fetched Fare Query Result for Ride ID ${ride._id || ride.id}: `, { fetchedFareData, fetchedFareError, isFetchingFare });


  // Calculate distance from driver to pickup location
  const distanceToPickup = useMemo(() => {
    if (driverLocation && ride.pickupLocation?.coordinates) {
      const pickupLat = ride.pickupLocation.coordinates[1];
      const pickupLng = ride.pickupLocation.coordinates[0];
      
      if (typeof pickupLat === 'number' && typeof pickupLng === 'number' &&
          typeof driverLocation.latitude === 'number' && typeof driverLocation.longitude === 'number') {
        
        const distKm = calculateDistance(
          driverLocation.latitude,
          driverLocation.longitude,
          pickupLat,
          pickupLng
        );

        if (distKm !== null) {
          const distMi = distKm * KM_TO_MILES_CONVERSION_FACTOR;
          return `${distMi.toFixed(2)} mi away`;
        }
        return "Distance unavailable";
      }
      return "Invalid location data";
    }
    return "Driver location N/A";
  }, [driverLocation, ride.pickupLocation?.coordinates]);

  // Helper function to fetch address from coordinates
  const getAddressFromCoordinates = async (lat, lng) => {
    if (!lat || !lng) return 'Coordinates missing';
    try {
      const url = REVERSE_GEOCODING_ENDPOINT.replace('{lat}', lat).replace('{lng}', lng);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Geocoding API request failed with status ${response.status}`);
      }
      const data = await response.json();
      // --- IMPORTANT ---
      // The path to the formatted address depends on the API provider.
      // For Google Maps, it's often data.results[0].formatted_address
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address; 
      } else if (data.error_message) {
        console.error('Geocoding API error:', data.error_message);
        return `Error: ${data.error_message}`;
      } else {
        return 'Address not found';
      }
    } catch (error) {
      console.error('Failed to fetch address:', error);
      return `Error fetching address: ${error.message}`;
    }
  };

  useEffect(() => {
    const fetchPickupAddress = async () => {
      if (ride.pickupLocation?.coordinates) {
        setPickupAddressError(null);
        setPickupAddress('Loading address...');
        const address = await getAddressFromCoordinates(
          ride.pickupLocation.coordinates[1], 
          ride.pickupLocation.coordinates[0]
        );
        if (address.toLowerCase().startsWith('error:') || address === 'Geocoding API key not available' || address === 'Address not found') {
            setPickupAddressError(address);
            setPickupAddress('N/A');
        } else {
            setPickupAddress(address);
        }
      } else {
        setPickupAddress('N/A');
      }
    };
    fetchPickupAddress();
  }, [ride.pickupLocation?.coordinates?.[0], ride.pickupLocation?.coordinates?.[1]]); // Re-run if pickup coordinates change

  useEffect(() => {
    const fetchDropoffAddress = async () => {
      if (ride.dropoffLocation?.coordinates) {
        setDropoffAddressError(null);
        setDropoffAddress('Loading address...');
        const address = await getAddressFromCoordinates(
          ride.dropoffLocation.coordinates[1], 
          ride.dropoffLocation.coordinates[0]
        );
        if (address.toLowerCase().startsWith('error:') || address === 'Geocoding API key not available' || address === 'Address not found') {
            setDropoffAddressError(address);
            setDropoffAddress('N/A');
        } else {
            setDropoffAddress(address);
        }
      } else {
        setDropoffAddress('N/A');
      }
    };
    fetchDropoffAddress();
  }, [ride.dropoffLocation?.coordinates?.[0], ride.dropoffLocation?.coordinates?.[1]]); // Re-run if dropoff coordinates change


  const handleAcceptRide = async () => {
    if (!ride._id) {
      console.error("Ride ID is missing, cannot accept.");
      return;
    }
    try {
      // Assuming "ACCEPTED" is the status for an accepted ride
      // You might also want to assign the driverId here if your backend expects it
      await updateRide({ id: ride._id, status: 'ACCEPTED' /*, driverId: currentDriverId (if needed) */ }).unwrap();
      // The list will automatically refresh due to tag invalidation in apiSlice
      console.log(`Ride ${ride._id} accepted successfully.`);
    } catch (err) {
      console.error(`Failed to accept ride ${ride._id}:`, err);
      // Error state (acceptRideError) will be populated by the hook
    }
  };

  // Log the results from the queries
  // console.log(`RideItemWithFare - Customer Query Result for Ride ID ${ride._id || ride.id} (Customer ID: ${ride.customerId}):`, { customerData, customerError, customerLoading });


  return (
    <li className="ride-item">
      {customerLoading && <p>Loading customer name...</p>}
      {customerError && <p>Error loading customer name.</p>}
      {customerData && <p><strong>Customer:</strong> {customerData.firstName} {customerData.lastName}</p>}
      
      <p>
        <strong>Pickup:</strong> {pickupAddressError ? <span style={{color: 'red'}}>{pickupAddressError}</span> : pickupAddress}
      </p>
      <p>
        <strong>Dropoff:</strong> {dropoffAddressError ? <span style={{color: 'red'}}>{dropoffAddressError}</span> : dropoffAddress}
      </p>
      <p>
        <strong>Ride Distance:</strong> {rideDistanceMi} {/* Display distance in miles */}
      </p>
      <p>
        <strong>Distance to Pickup:</strong> {distanceToPickup}
      </p>
      <p>
        <strong>Estimated Fare: </strong> 
        {ride.estimatedFare !== undefined && ride.estimatedFare !== null ? `$${Number(ride.estimatedFare).toFixed(2)}` : 'N/A'}
      </p>
      <button 
        onClick={handleAcceptRide} 
        disabled={isAcceptingRide}
        className="nav-button2 accept-ride-button" 
      >
        {isAcceptingRide ? 'Accepting...' : 'Accept Ride'}
      </button>
      {acceptRideError && <p className="error-message" style={{fontSize: '0.8em', color: 'red', marginTop: '5px'}}>Failed to accept: {acceptRideError.data?.message || 'Please try again'}</p>}
    </li>
  );
};

export default RideItemWithFare;