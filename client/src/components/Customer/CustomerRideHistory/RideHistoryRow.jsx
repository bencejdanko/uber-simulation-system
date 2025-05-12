import React from 'react';
import { useGetDriverByIdQuery } from '../../../api/apiSlice';

const RideHistoryRow = ({ ride, onCancelRide, isCancelling }) => {
  const { data: driverData, isLoading: isLoadingDriver } = useGetDriverByIdQuery(
    ride.driverId,
    { skip: !ride.driverId } // Skip query if no driverId
  );

  let driverDisplay = 'N/A';
  if (ride.driverId) {
    if (isLoadingDriver) {
      driverDisplay = 'Loading...';
    } else if (driverData && driverData.firstName) {
      driverDisplay = driverData.firstName;
    } else if (driverData) {
      // Driver data fetched but no firstName, could show ID or generic message
      driverDisplay = 'Driver (Details Pending)';
    }
    // If driverData is null and not loading, it means fetch failed or driver not found for ID
    // 'N/A' remains appropriate or a specific error message could be shown.
  }

  return (
    <tr key={ride.id}>
      <td>{ride.id ? ride.id.substring(0, 8) + '...' : 'N/A'}</td>
      <td>
        {ride.pickupLocation?.latitude?.toFixed(4) || 'N/A'}, {ride.pickupLocation?.longitude?.toFixed(4) || 'N/A'}
      </td>
      <td>
        {ride.dropOffLocation?.latitude?.toFixed(4) || 'N/A'}, {ride.dropOffLocation?.longitude?.toFixed(4) || 'N/A'}
      </td>
      <td>{ride.dateTime}</td>
      <td>${ride.predictedPrice.toFixed(2)}</td>
      <td>${ride.actualPrice.toFixed(2)}</td>
      <td>{driverDisplay}</td>
      <td>
        <span className={`status ${ride.status ? ride.status.toLowerCase() : 'unknown'}`}>
          {ride.status || 'Unknown'}
        </span>
      </td>
      <td>
        {(ride.status === 'Pending' || ride.status === 'REQUESTED' || ride.status === 'ACCEPTED') && (
          <button
            onClick={() => onCancelRide(ride.id)}
            className="cancel-button"
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
      </td>
    </tr>
  );
};

export default RideHistoryRow;