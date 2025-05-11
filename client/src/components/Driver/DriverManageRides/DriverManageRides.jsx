import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DriverManageRides.css';

const DriverManageRides = () => {
  const navigate = useNavigate();

  const [rides, setRides] = useState([
    {
      id: 'R123-45-6789',
      pickupLocation: 'Downtown, NY',
      dropoffLocation: 'Airport, NY',
      dateTime: '2025-04-15 10:00 AM',
      status: 'Pending',
      fare: '$25.00',
    },
    {
      id: 'R123-45-6790',
      pickupLocation: 'Mall, NY',
      dropoffLocation: 'University, NY',
      dateTime: '2025-04-15 2:00 PM',
      status: 'Completed',
      fare: '$18.75',
    },
    {
      id: 'R123-45-6791',
      pickupLocation: 'Suburbs, NY',
      dropoffLocation: 'Downtown, NY',
      dateTime: '2025-04-14 9:00 AM',
      status: 'Cancelled',
      fare: '$0.00',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState('');

  const handleAcceptRide = (rideId) => {
    setRides((prevRides) =>
      prevRides.map((ride) =>
        ride.id === rideId ? { ...ride, status: 'Accepted' } : ride
      )
    );
    console.log(`Ride ${rideId} accepted.`);
  };

  const handleRejectRide = (rideId) => {
    setRides((prevRides) =>
      prevRides.map((ride) =>
        ride.id === rideId ? { ...ride, status: 'Rejected' } : ride
      )
    );
    console.log(`Ride ${rideId} rejected.`);
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
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

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
                  {ride.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleAcceptRide(ride.id)}
                        className="accept-button"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRide(ride.id)}
                        className="reject-button"
                      >
                        Reject
                      </button>
                    </>
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