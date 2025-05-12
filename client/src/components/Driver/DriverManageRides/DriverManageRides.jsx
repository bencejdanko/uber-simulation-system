import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdateRideMutation, useSearchRidesQuery } from '../../../api/apiSlice';
import './DriverManageRides.css';

const DriverManageRides = ({ userId }) => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [updateRide, { isLoading: isUpdating, error: updateError }] = useUpdateRideMutation();
  
  // Fetch rides assigned to the current driver
  const { data: ridesData, isLoading, error } = useSearchRidesQuery({ 
    driverId: userId  // Use the userId prop as the driverId parameter
  });
  
  // Convert fetched rides to the format expected by the component
  const [rides, setRides] = useState([]);

  // Update state when API data is loaded
  useEffect(() => {
    if (ridesData && ridesData.rides) {
      const formattedRides = ridesData.rides.map(ride => ({
        id: ride._id,
        pickupLocation: ride.pickupLocation.coordinates 
          ? `${ride.pickupLocation.coordinates[1]}, ${ride.pickupLocation.coordinates[0]}`
          : 'Unknown',
        dropoffLocation: ride.dropoffLocation.coordinates
          ? `${ride.dropoffLocation.coordinates[1]}, ${ride.dropoffLocation.coordinates[0]}`
          : 'Unknown',
        dateTime: new Date(ride.createdAt).toLocaleString(),
        status: ride.status,
        fare: ride.estimatedFare ? `$${ride.estimatedFare.toFixed(2)}` : 'N/A',
      }));
      setRides(formattedRides);
    }
  }, [ridesData]);

  const handleAcceptRide = async (rideId) => {
    try {
      const updateData = {
        id: rideId,
        status: 'ACCEPTED',
        driverId: userId  // Pass the userId as the driverId
      };
      
      console.log('Sending update data to accept ride:', updateData);
      
      // Call the API to update the ride status and assign the driver
      const result = await updateRide(updateData).unwrap();
      
      console.log('API response for accept ride:', result);
      console.log('Was driverId set?', result.driverId === userId ? 'Yes' : 'No, it is: ' + result.driverId);
      
      // Update local state
      setRides((prevRides) =>
        prevRides.map((ride) =>
          ride.id === rideId ? { ...ride, status: 'ACCEPTED', driverId: userId } : ride
        )
      );
      console.log(`Ride ${rideId} accepted by driver ${userId}.`);
    } catch (error) {
      console.error('Failed to accept ride:', error);
      if (error.data) {
        console.error('Server error response:', error.data);
        setErrorMessage(error.data.message || 'Failed to accept ride');
      } else if (error.status) {
        console.error('HTTP status code:', error.status);
        setErrorMessage(`Server error (${error.status}): Failed to accept ride`);
      } else {
        setErrorMessage('Failed to accept ride. Please try again.');
      }
    }
  };

  const handleRejectRide = async (rideId) => {
    try {
      // Call the API to update the ride status
      await updateRide({
        id: rideId,
        status: 'CANCELLED'
      }).unwrap();
      
      // Update local state
      setRides((prevRides) =>
        prevRides.map((ride) =>
          ride.id === rideId ? { ...ride, status: 'CANCELLED' } : ride
        )
      );
      console.log(`Ride ${rideId} rejected.`);
    } catch (error) {
      console.error('Failed to reject ride:', error);
    }
  };

  const handleUpdateRideStatus = async (rideId, newStatus) => {
    try {
      // Call the API to update the ride status
      await updateRide({
        id: rideId,
        status: newStatus
      }).unwrap();
      
      // Update local state
      setRides((prevRides) =>
        prevRides.map((ride) =>
          ride.id === rideId ? { ...ride, status: newStatus } : ride
        )
      );
      console.log(`Ride ${rideId} status updated to ${newStatus}.`);
    } catch (error) {
      console.error(`Failed to update ride to ${newStatus}:`, error);
    }
  };

  const filteredRides = rides.filter(
    (ride) => !filterStatus || ride.status.toLowerCase() === filterStatus.toLowerCase()
  );

  return (
    <div className="manage-rides-container">
      <header className="manage-rides-header">
        <div className="manage-rides-logo">Uber</div>
        <div className="manage-rides-title">Manage Rides</div>
      </header>

      <div className="manage-rides-section">
        <h2 className="section-title">Your Rides</h2>

        <div className="filter-section">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="">All Statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {isLoading && <p>Loading rides...</p>}
        {error && <p className="error-message">Error loading rides: {error.toString()}</p>}
        {updateError && <p className="error-message">Error updating ride: {updateError.toString()}</p>}
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <table className="rides-table">
          <thead>
            <tr>
              <th>Ride ID</th>
              <th>Pickup Location</th>
              <th>Drop-off Location</th>
              <th>Date/Time</th>
              <th>Status</th>
              <th>Fare</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRides.map((ride) => (
              <tr key={ride.id}>
                <td>{ride.id}</td>
                <td>{ride.pickupLocation}</td>
                <td>{ride.dropoffLocation}</td>
                <td>{ride.dateTime}</td>
                <td>
                  <span className={`status ${ride.status.toLowerCase()}`}>
                    {ride.status}
                  </span>
                </td>
                <td>{ride.fare}</td>
                <td>
                  {ride.status === 'REQUESTED' && (
                    <>
                      <button
                        onClick={() => handleAcceptRide(ride.id)}
                        className="accept-button"
                        disabled={isUpdating}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRide(ride.id)}
                        className="reject-button"
                        disabled={isUpdating}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {ride.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleUpdateRideStatus(ride.id, 'IN_PROGRESS')}
                      className="start-button"
                      disabled={isUpdating}
                    >
                      Start Ride
                    </button>
                  )}
                  {ride.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateRideStatus(ride.id, 'COMPLETED')}
                      className="complete-button"
                      disabled={isUpdating}
                    >
                      Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="navigation-buttons">
        <button className="nav-button" onClick={() => navigate('/')}>
          Home
        </button>
        <button className="nav-button" onClick={() => navigate('/driver/dashboard')}>
          Driver Dashboard
        </button>
        <button className="nav-button" onClick={() => navigate('/driver/earnings')}>
          Driver Earnings
        </button>
        <button className="nav-button" onClick={() => navigate('/admin/dashboard')}>
          Admin Dashboard
        </button>
      </div>
    </div>
  );
};

export default DriverManageRides;