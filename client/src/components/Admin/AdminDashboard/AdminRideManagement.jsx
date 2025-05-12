import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDriverForm.css';

const API_BASE_URL = 'http://localhost:3001/api/v1';

const AdminRideManagement = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRide, setSelectedRide] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Fetch rides from API
  const fetchRides = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/rides`);
      if (response.data && response.data.success) {
        setRides(response.data.data || []);
      } else {
        setError('Failed to fetch rides');
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
      setError('Error fetching rides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch rides on component mount and when filters change
  useEffect(() => {
    fetchRides();
  }, [filterStatus]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchTerm) {
      fetchRides();
      return;
    }
    
    const filteredRides = rides.filter(ride => 
      ride.rideId?.toString().includes(searchTerm) ||
      ride.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.pickup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.destination?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setRides(filteredRides);
  };

  // Handle date filter
  const handleDateFilter = (e) => {
    e.preventDefault();
    fetchRides();
  };

  // View ride details
  const handleViewRide = (ride) => {
    setSelectedRide(ride);
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format duration in minutes
  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours + 'h ' + (remainingMinutes > 0 ? remainingMinutes + 'm' : '');
  };

  // Calculate and format ride status
  const getRideStatus = (ride) => {
    if (!ride.status) return 'UNKNOWN';
    return ride.status.toUpperCase();
  };

  // Render ride details view
  const renderRideDetails = () => (
    <div className="ride-details">
      <h3>Ride Details</h3>
      
      <div className="details-container">
        <div className="details-section">
          <h4>Basic Information</h4>
          <div className="info-row">
            <span className="info-label">Ride ID:</span>
            <span className="info-value">{selectedRide.rideId}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Date:</span>
            <span className="info-value">{formatDateTime(selectedRide.requestTime)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Status:</span>
            <span className={`info-value status-${selectedRide.status?.toLowerCase()}`}>
              {getRideStatus(selectedRide)}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Fare:</span>
            <span className="info-value">${parseFloat(selectedRide.fare || 0).toFixed(2)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Duration:</span>
            <span className="info-value">{formatDuration(selectedRide.durationMinutes)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Distance:</span>
            <span className="info-value">{(selectedRide.distanceKm || 0).toFixed(1)} km</span>
          </div>
        </div>
        
        <div className="details-section">
          <h4>Locations</h4>
          <div className="info-row">
            <span className="info-label">Pickup:</span>
            <span className="info-value">{selectedRide.pickup}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Destination:</span>
            <span className="info-value">{selectedRide.destination}</span>
          </div>
        </div>
        
        <div className="details-section">
          <h4>Participants</h4>
          <div className="info-row">
            <span className="info-label">Customer:</span>
            <span className="info-value">{selectedRide.customerName || 'Unknown'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Driver:</span>
            <span className="info-value">{selectedRide.driverName || 'Unknown'}</span>
          </div>
        </div>
        
        {selectedRide.notes && (
          <div className="details-section">
            <h4>Notes</h4>
            <p className="notes-text">{selectedRide.notes}</p>
          </div>
        )}
      </div>
      
      <div className="ride-actions">
        <button onClick={() => setSelectedRide(null)} className="back-button">
          Back to Rides
        </button>
      </div>
    </div>
  );

  // Render ride list view
  const renderRideList = () => (
    <>
      <div className="admin-section-header">
        <h2>Ride Management</h2>
      </div>
      
      <div className="filter-controls">
        <div className="filter-section">
          <label>Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="SCHEDULED">Scheduled</option>
          </select>
        </div>
        
        <form onSubmit={handleDateFilter} className="filter-section date-filter">
          <label>Date Range:</label>
          <div className="date-inputs">
            <input 
              type="date" 
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              placeholder="Start Date"
            />
            <span>to</span>
            <input 
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              placeholder="End Date"
            />
          </div>
          <button type="submit">Apply Filter</button>
        </form>
        
        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            placeholder="Search by ID, customer, driver, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>
      
      {rides.length === 0 ? (
        <div className="no-data-message">No rides found.</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Driver</th>
                <th>Pickup</th>
                <th>Destination</th>
                <th>Fare</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rides.map(ride => (
                <tr key={ride.rideId}>
                  <td>{ride.rideId}</td>
                  <td>{formatDateTime(ride.requestTime)}</td>
                  <td>{ride.customerName}</td>
                  <td>{ride.driverName}</td>
                  <td className="truncate-text">{ride.pickup}</td>
                  <td className="truncate-text">{ride.destination}</td>
                  <td>${parseFloat(ride.fare || 0).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${ride.status?.toLowerCase() || 'unknown'}`}>
                      {getRideStatus(ride)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="view-button"
                        onClick={() => handleViewRide(ride)}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  return (
    <div className="admin-rides-container">
      {loading ? (
        <div className="loading-indicator">Loading data...</div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
        </div>
      ) : selectedRide ? (
        renderRideDetails()
      ) : (
        renderRideList()
      )}
    </div>
  );
};

export default AdminRideManagement; 