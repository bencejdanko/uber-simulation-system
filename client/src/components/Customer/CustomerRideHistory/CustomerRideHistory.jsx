import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerRideHistory.css';
import useCustomerAuth from '../../../hooks/useCustomerAuth';
import { useSearchRidesQuery, useCancelRideMutation } from '../../../api/apiSlice';
import RideHistoryRow from './RideHistoryRow'; // Import the new component

const CustomerRideHistory = () => {
  const navigate = useNavigate();
  const { userId, authChecked, error: authError } = useCustomerAuth('accessToken', '/login-customer');

  const {
    data: searchRidesData,
    isLoading: isLoadingRides,
    error: ridesApiError,
    refetch: refetchRidesHistory,
  } = useSearchRidesQuery(
    { customerId: userId, limit: 100, page: 1 },
    { skip: !userId || !authChecked }
  );

  const [cancelRideMutation, { isLoading: isCancellingMutationLoading }] = useCancelRideMutation();

  const [ridesHistory, setRidesHistory] = useState([]);
  const [cancellationError, setCancellationError] = useState(null);
  const [cancellingRideId, setCancellingRideId] = useState(null); // To track which ride is being cancelled

  useEffect(() => {
    if (searchRidesData && searchRidesData.rides) {
      const formattedRides = searchRidesData.rides.map((ride) => ({
        id: ride._id,
        pickupLocation: {
          latitude: ride.pickupLocation?.coordinates?.[1],
          longitude: ride.pickupLocation?.coordinates?.[0],
        },
        dropOffLocation: {
          latitude: ride.dropoffLocation?.coordinates?.[1],
          longitude: ride.dropoffLocation?.coordinates?.[0],
        },
        dateTime: new Date(ride.createdAt).toLocaleString(),
        // customerId: ride.customerId, // Not directly displayed, but available if needed
        driverId: ride.driverId || null, // Pass driverId to the row component
        predictedPrice: ride.estimatedFare !== undefined ? ride.estimatedFare : 0,
        actualPrice: ride.actualFare !== undefined ? ride.actualFare : 0,
        status: ride.status,
      }));
      setRidesHistory(formattedRides);
    } else if (searchRidesData && !searchRidesData.rides) {
        setRidesHistory([]); // Handle case where API returns data but rides array is missing/empty
    }
  }, [searchRidesData]);

  const handleCancelRide = async (rideId) => {
    setCancellationError(null);
    setCancellingRideId(rideId); // Set which ride is being cancelled
    try {
      await cancelRideMutation(rideId).unwrap();
      refetchRidesHistory();
      console.log(`Ride ${rideId} has been cancelled.`);
    } catch (error) {
      console.error('Failed to cancel ride:', error);
      setCancellationError(error.data?.message || error.error || 'Failed to cancel ride.');
    } finally {
      setCancellingRideId(null); // Reset
    }
  };

  if (!authChecked) {
    return <div className="rides-container"><p>Authenticating...</p></div>;
  }
  if (authError) {
    return <div className="rides-container error-message"><p>Authentication Error: {authError}</p></div>;
  }
  if (isLoadingRides) {
    return <div className="rides-container"><p>Loading ride history...</p></div>;
  }
  if (ridesApiError) {
    return <div className="rides-container error-message"><p>Error loading rides: {ridesApiError.data?.message || ridesApiError.error}</p></div>;
  }

  return (
    <div className="rides-container">
      <header className="rides-header">
        <div className="rides-logo">Uber</div>
        <div className="rides-title">Ride History</div>
      </header>

      <div className="rides-section">
        <h2 className="section-title">Your Rides</h2>
        {cancellationError && <p className="error-message" style={{ textAlign: 'center', marginBottom: '15px' }}>{cancellationError}</p>}
        {ridesHistory.length === 0 && !isLoadingRides && (
          <p style={{ textAlign: 'center' }}>You have no ride history.</p>
        )}
        {ridesHistory.length > 0 && (
          <table className="rides-table">
            <thead>
              <tr>
                <th>Ride ID</th>
                <th>Pickup Location (Lat, Long)</th>
                <th>Drop Off Location (Lat, Long)</th>
                <th>Date/Time</th>
                <th>Predicted Price ($)</th>
                <th>Actual Price ($)</th>
                <th>Driver Name</th> {/* Changed from Driver ID */}
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {ridesHistory.map((ride) => (
                <RideHistoryRow
                  key={ride.id}
                  ride={ride}
                  onCancelRide={handleCancelRide}
                  isCancelling={isCancellingMutationLoading && cancellingRideId === ride.id}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="navigation-buttons">
        <button className="nav-button" onClick={() => navigate('/')}>
          Home
        </button>
        <button className="nav-button" onClick={() => navigate('/customer/dashboard')}>
          Customer Dashboard
        </button>
      </div>
    </div>
  );
};

export default CustomerRideHistory;