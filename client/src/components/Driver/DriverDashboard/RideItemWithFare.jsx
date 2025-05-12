import React from 'react';
import { useGetEstimatedFareQuery, useGetCustomerByIdQuery } from '../../../api/apiSlice'; // Import useGetCustomerByIdQuery

const RideItemWithFare = ({ ride }) => {
  // Log the incoming ride object
  console.log(`RideItemWithFare - Ride ID: ${ride._id || ride.id}`, ride);

  const fareQueryParams = {
    pickupLat: ride.pickupLocation?.coordinates?.[1],
    pickupLng: ride.pickupLocation?.coordinates?.[0],
    dropoffLat: ride.dropoffLocation?.coordinates?.[1],
    dropoffLng: ride.dropoffLocation?.coordinates?.[0],
    vehicleType: ride.vehicleType,
    // requestTime: ride.createdAt, // Optional
  };

  // Log parameters being sent to the fare query
  console.log(`RideItemWithFare - Fare Query Params for Ride ID ${ride._id || ride.id}:`, fareQueryParams);

  const shouldSkipFareQuery = !fareQueryParams.pickupLat || !fareQueryParams.pickupLng || 
                             !fareQueryParams.dropoffLat || !fareQueryParams.dropoffLng || 
                             !fareQueryParams.vehicleType;

  // Log if the fare query is being skipped
  console.log(`RideItemWithFare - Should skip Fare Query for Ride ID ${ride._id || ride.id}?`, shouldSkipFareQuery);
  
  const { data: fareData, error: fareError, isLoading: fareLoading } = useGetEstimatedFareQuery(fareQueryParams, {
    skip: shouldSkipFareQuery,
  });

  // Fetch customer details
  const { data: customerData, error: customerError, isLoading: customerLoading } = useGetCustomerByIdQuery(ride.customerId, {
    skip: !ride.customerId, // Skip if customerId is not present in the ride object
  });

  // Log the results from the queries
  console.log(`RideItemWithFare - Fare Query Result for Ride ID ${ride._id || ride.id}:`, { fareData, fareError, fareLoading });
  console.log(`RideItemWithFare - Customer Query Result for Ride ID ${ride._id || ride.id} (Customer ID: ${ride.customerId}):`, { customerData, customerError, customerLoading });


  return (
    <li className="ride-item">
      {customerLoading && <p>Loading customer name...</p>}
      {customerError && <p>Error loading customer name.</p>}
      {customerData && <p><strong>Customer:</strong> {customerData.firstName} {customerData.lastName}</p>}
      
      <p>
        <strong>Pickup:</strong> 
        Lat: {ride.pickupLocation?.coordinates?.[1] ?? 'N/A'}, 
        Lng: {ride.pickupLocation?.coordinates?.[0] ?? 'N/A'}
      </p>
      <p>
        <strong>Dropoff:</strong> 
        Lat: {ride.dropoffLocation?.coordinates?.[1] ?? 'N/A'}, 
        Lng: {ride.dropoffLocation?.coordinates?.[0] ?? 'N/A'}
      </p>
      <p>
        <strong>Estimated Fare:</strong> 
        {fareLoading && 'Loading fare...'}
        {fareError && `Error: ${fareError.data?.message || fareError.error || 'Could not fetch fare'}`}
        {fareData && fareData.estimatedFare !== undefined ? `$${fareData.estimatedFare.toFixed(2)}` : (!fareLoading && !fareError ? 'N/A' : '')}
      </p>
      {/* <button onClick={() => handleAcceptRide(ride._id || ride.id)}>Accept Ride</button> */}
    </li>
  );
};

export default RideItemWithFare;