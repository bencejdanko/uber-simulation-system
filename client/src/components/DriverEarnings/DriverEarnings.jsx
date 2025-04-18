import React from 'react';
import './DriverEarnings.css';

const DriverEarnings = () => {
  const trips = [
    {
      billingId: '847-29-1234',
      rideId: 'R123-45-6789',
      customerId: 'C123-45-6789',
      driverId: 'D123-45-6789',
      date: '2025-04-07',
      pickupTime: '2025-04-07T10:00:00Z',
      dropoffTime: '2025-04-07T10:30:00Z',
      distanceCovered: 10,
      sourceLocation: {
        latitude: 40.7128,
        longitude: -74.0060,
        addressLine: 'Downtown, NY',
      },
      destinationLocation: {
        latitude: 40.7306,
        longitude: -73.9352,
        addressLine: 'Airport, NY',
      },
      predictedAmount: 25.0,
      actualAmount: 24.5,
      paymentStatus: 'PAID',
      createdAt: '2025-04-07T09:50:00Z',
      updatedAt: '2025-04-07T10:35:00Z',
      status: 'Completed',
    },
    {
      billingId: '846-23-5678',
      rideId: 'R123-45-6790',
      customerId: 'C123-45-6790',
      driverId: 'D123-45-6790',
      date: '2025-04-07',
      pickupTime: '2025-04-07T14:00:00Z',
      dropoffTime: '2025-04-07T14:20:00Z',
      distanceCovered: 5,
      sourceLocation: {
        latitude: 40.7580,
        longitude: -73.9855,
        addressLine: 'Mall, NY',
      },
      destinationLocation: {
        latitude: 40.7128,
        longitude: -74.0060,
        addressLine: 'University, NY',
      },
      predictedAmount: 30.0,
      actualAmount: 28.5,
      paymentStatus: 'PAID',
      createdAt: '2025-04-07T13:50:00Z',
      updatedAt: '2025-04-07T14:25:00Z',
      status: 'Completed',
    },
    {
      billingId: '845-02-3456',
      rideId: 'R123-45-6791',
      customerId: 'C123-45-6791',
      driverId: 'D123-45-6791',
      date: '2025-04-08',
      pickupTime: '2025-04-08T09:00:00Z',
      dropoffTime: '2025-04-08T09:45:00Z',
      distanceCovered: 15,
      sourceLocation: {
        latitude: 40.7306,
        longitude: -73.9352,
        addressLine: 'Suburbs, NY',
      },
      destinationLocation: {
        latitude: 40.7580,
        longitude: -73.9855,
        addressLine: 'Downtown, NY',
      },
      predictedAmount: 40.0,
      actualAmount: 0.0,
      paymentStatus: 'FAILED',
      createdAt: '2025-04-08T08:50:00Z',
      updatedAt: '2025-04-08T09:50:00Z',
      status: 'Cancelled',
    },
  ];

  return (
    <div className="driver-earnings-container">
      <header className="earnings-header">
        <div className="earnings-logo">Uber</div>
        <div className="earnings-title">Driver Earnings</div>
      </header>

      <div className="earnings-section">
        <h2 className="section-title">All Trips</h2>
        <table className="trips-table">
          <thead>
            <tr>
              <th>Billing ID</th>
              <th>Date</th>
              <th>Pickup Time</th>
              <th>Drop Off Time</th>
              <th>Distance (mi)</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Predicted ($)</th>
              <th>Actual ($)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip.billingId}>
                <td>{trip.billingId}</td>
                <td>{trip.date}</td>
                <td>{new Date(trip.pickupTime).toLocaleTimeString()}</td>
                <td>{new Date(trip.dropoffTime).toLocaleTimeString()}</td>
                <td>{trip.distanceCovered}</td>
                <td>{trip.sourceLocation.addressLine || 'N/A'}</td>
                <td>{trip.destinationLocation.addressLine || 'N/A'}</td>
                <td>${trip.predictedAmount.toFixed(2)}</td>
                <td>${trip.actualAmount.toFixed(2)}</td>
                <td className={trip.status === 'Cancelled' ? 'status-cancelled' : ''}>
                  {trip.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DriverEarnings;