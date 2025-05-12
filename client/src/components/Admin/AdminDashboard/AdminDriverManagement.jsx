import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AdminDriverForm.css';

const API_BASE_URL = 'http://localhost:3001/api/v1';

const AdminDriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverDetails, setDriverDetails] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    carDetails: '',
    status: 'active'
  });

  // Fetch drivers from API - memoize to use in useEffect
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/drivers`);
      if (response.data && response.data.success) {
        console.log('Fetched drivers:', response.data.data);
        setDrivers(response.data.data || []);
      } else {
        setError('Failed to fetch drivers');
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError('Error fetching drivers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up periodic refresh
  useEffect(() => {
    fetchDrivers();
    
    // Set up auto-refresh
    const intervalId = setInterval(fetchDrivers, refreshInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [fetchDrivers, refreshInterval]);

  // Fetch driver details when a driver is selected
  useEffect(() => {
    if (selectedDriver && selectedDriver._id) {
      const fetchDriverDetails = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/admin/drivers/${selectedDriver._id}`);
          if (response.data && response.data.success) {
            setDriverDetails(response.data.data);
          }
        } catch (error) {
          console.error('Error fetching driver details:', error);
        }
      };
      
      fetchDriverDetails();
    } else {
      setDriverDetails(null);
    }
  }, [selectedDriver]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm) {
      fetchDrivers();
      return;
    }
    
    const filteredDrivers = drivers.filter(driver => 
      driver.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm)
    );
    
    setDrivers(filteredDrivers);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Show add driver form
  const handleAddDriver = () => {
    setSelectedDriver(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      carDetails: '',
      status: 'active'
    });
    setShowForm(true);
  };

  // Show edit driver form
  const handleEditDriver = (driver) => {
    setSelectedDriver(driver);
    
    // Format car details for the form
    const carDetails = driver.vehicle 
      ? `${driver.vehicle.make || ''}, ${driver.vehicle.model || ''}, ${driver.vehicle.year || ''}`
      : '';
    
    setFormData({
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone,
      address: driver.address || '',
      city: driver.city || '',
      state: driver.state || '',
      zipCode: driver.zipCode || '',
      carDetails: carDetails,
      status: driver.status
    });
    setShowForm(true);
  };

  // Show driver details
  const handleViewDriver = (driver) => {
    setSelectedDriver(driver);
    setShowForm(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Parse car details
      const carParts = formData.carDetails.split(',').map(part => part.trim());
      const make = carParts[0] || 'Unknown';
      const model = carParts[1] || 'Unknown';
      const year = parseInt(carParts[2]) || new Date().getFullYear();
      
      // Format the data for the API
      const driverData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        status: formData.status,
        vehicle: {
          make: make,
          model: model,
          year: year,
          color: 'Unknown',
          licensePlate: 'Unknown'
        }
      };
      
      console.log('Sending driver data:', driverData);
      
      let response;
      if (selectedDriver) {
        // Update existing driver
        response = await axios.put(`${API_BASE_URL}/admin/drivers/${selectedDriver._id}`, driverData);
        if (response.data && response.data.success) {
          setShowForm(false);
          fetchDrivers();
        } else {
          setError(response.data?.error || 'Failed to update driver');
          setLoading(false);
        }
      } else {
        // Add new driver
        response = await axios.post(`${API_BASE_URL}/admin/drivers`, driverData);
        if (response.data && response.data.success) {
          setShowForm(false);
          fetchDrivers();
        } else {
          setError(response.data?.error || 'Failed to add driver');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Error saving driver:', err);
      setError(err.response?.data?.error || 'Failed to save driver. Please try again.');
      setLoading(false);
    }
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setSelectedDriver(null);
  };

  // Go back to driver list
  const handleBackToList = () => {
    setSelectedDriver(null);
    setDriverDetails(null);
  };

  // Render driver form
  const renderDriverForm = () => (
    <div className="admin-form-container">
      <h3>{selectedDriver ? 'Edit Driver' : 'Add New Driver'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input 
              type="text" 
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input 
              type="text" 
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input 
              type="text" 
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Address</label>
            <input 
              type="text" 
              name="address"
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>City</label>
            <input 
              type="text" 
              name="city"
              value={formData.city}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>State</label>
            <input 
              type="text" 
              name="state"
              value={formData.state}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Zip Code</label>
            <input 
              type="text" 
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Car Details</label>
          <input 
            type="text" 
            name="carDetails"
            value={formData.carDetails}
            onChange={handleInputChange}
            placeholder="Make, Model, Year"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Status</label>
          <select 
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="cancel-button">
            Cancel
          </button>
          <button type="submit" className="submit-button">
            {selectedDriver ? 'Update Driver' : 'Add Driver'}
          </button>
        </div>
      </form>
    </div>
  );

  // Render driver details view
  const renderDriverDetails = () => {
    if (!driverDetails) return <div className="loading-indicator">Loading driver details...</div>;
    
    const { driver, reviews, rides, reviewCount, rideCount } = driverDetails;
    
    return (
      <div className="driver-details-container">
        <button className="back-button" onClick={handleBackToList}>← Back to Drivers</button>
        
        <div className="driver-profile">
          <h2>{driver.firstName} {driver.lastName}</h2>
          <div className="driver-rating">Rating: {driver.rating} ★</div>
          
          <div className="driver-info-grid">
            <div className="info-section">
              <h3>Contact Information</h3>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{driver.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone:</span>
                <span className="info-value">{driver.phone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Address:</span>
                <span className="info-value">
                  {driver.address && 
                    `${driver.address}, ${driver.city}, ${driver.state} ${driver.zipCode}`}
                </span>
              </div>
            </div>
            
            <div className="info-section">
              <h3>Driver Information</h3>
              <div className="info-item">
                <span className="info-label">Driver ID:</span>
                <span className="info-value">{driver._id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className={`status-badge ${driver.status}`}>{driver.status}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Total Rides:</span>
                <span className="info-value">{rideCount}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Reviews:</span>
                <span className="info-value">{reviewCount}</span>
              </div>
            </div>
            
            <div className="info-section">
              <h3>Vehicle Information</h3>
              {driver.vehicle && (
                <>
                  <div className="info-item">
                    <span className="info-label">Make:</span>
                    <span className="info-value">{driver.vehicle.make}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Model:</span>
                    <span className="info-value">{driver.vehicle.model}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Year:</span>
                    <span className="info-value">{driver.vehicle.year}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">License Plate:</span>
                    <span className="info-value">{driver.vehicle.licensePlate}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Driver Reviews Section */}
          <div className="driver-reviews-section">
            <h3>Recent Reviews</h3>
            {reviews.length > 0 ? (
              <div className="review-list">
                {reviews.map(review => (
                  <div key={review._id} className="review-item">
                    <div className="review-header">
                      <span className="review-rating">{review.rating} ★</span>
                      <span className="review-date">
                        {new Date(review.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No reviews yet.</p>
            )}
          </div>
          
          {/* Driver Rides Section */}
          <div className="driver-rides-section">
            <h3>Recent Rides</h3>
            {rides.length > 0 ? (
              <div className="rides-table-container">
                <table className="rides-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Pickup</th>
                      <th>Dropoff</th>
                      <th>Status</th>
                      <th>Fare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.map(ride => (
                      <tr key={ride._id}>
                        <td>{new Date(ride.requestTime).toLocaleDateString()}</td>
                        <td>{ride.pickup?.address || 'N/A'}</td>
                        <td>{ride.dropoff?.address || 'N/A'}</td>
                        <td><span className={`status-badge ${ride.status}`}>{ride.status}</span></td>
                        <td>${ride.fare?.toFixed(2) || '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No rides yet.</p>
            )}
          </div>
          
          <div className="driver-actions">
            <button onClick={() => handleEditDriver(driver)} className="edit-button">
              Edit Driver
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render driver list
  const renderDriverList = () => (
    <>
      <div className="admin-section-header">
        <h2>Manage Drivers</h2>
        <button className="add-button" onClick={handleAddDriver}>
          Add New Driver
        </button>
      </div>
      
      <div className="refresh-controls">
        <select 
          value={refreshInterval} 
          onChange={(e) => setRefreshInterval(Number(e.target.value))}
          className="refresh-select"
        >
          <option value={0}>Manual refresh</option>
          <option value={10000}>Refresh every 10s</option>
          <option value={30000}>Refresh every 30s</option>
          <option value={60000}>Refresh every 1m</option>
        </select>
        <button onClick={fetchDrivers} className="refresh-button">
          Refresh Now
        </button>
      </div>
      
      <div className="search-bar">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>
      
      {drivers.length === 0 ? (
        <div className="no-data-message">No drivers found.</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Car Details</th>
                <th>Rating</th>
                <th>Rides</th>
                <th>Reviews</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(driver => (
                <tr key={driver._id}>
                  <td>{driver._id}</td>
                  <td>{`${driver.firstName} ${driver.lastName}`}</td>
                  <td>{driver.email}</td>
                  <td>{driver.phone}</td>
                  <td>{driver.vehicle ? `${driver.vehicle.make} ${driver.vehicle.model} (${driver.vehicle.year})` : 'N/A'}</td>
                  <td>{driver.rating} ★</td>
                  <td>{driver.rideCount || 0}</td>
                  <td>{driver.reviewCount || 0}</td>
                  <td>
                    <span className={`status-badge ${driver.status}`}>
                      {driver.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="view-button" onClick={() => handleViewDriver(driver)}>
                        View
                      </button>
                      <button className="edit-button" onClick={() => handleEditDriver(driver)}>
                        Edit
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
    <div className="admin-drivers-container">
      {loading && !showForm && !selectedDriver ? (
        <div className="loading-indicator">Loading data...</div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
        </div>
      ) : showForm ? (
        renderDriverForm()
      ) : selectedDriver ? (
        renderDriverDetails()
      ) : (
        renderDriverList()
      )}
    </div>
  );
};

export default AdminDriverManagement; 