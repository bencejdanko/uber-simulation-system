import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDriverForm.css';

const AdminDriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    carDetails: '',
    status: 'ACTIVE'
  });

  // Fetch drivers from API
  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/v1/admin/drivers');
      if (response.data && response.data.data) {
        setDrivers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Failed to fetch drivers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch drivers on component mount
  useEffect(() => {
    fetchDrivers();
  }, []);

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
      carDetails: '',
      status: 'ACTIVE'
    });
    setShowForm(true);
  };

  // Show edit driver form
  const handleEditDriver = (driver) => {
    setSelectedDriver(driver);
    setFormData({
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone,
      carDetails: driver.carDetails || '',
      status: driver.status
    });
    setShowForm(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (selectedDriver) {
        // Update existing driver
        await axios.put(`/api/v1/admin/drivers/${selectedDriver.id}`, formData);
      } else {
        // Add new driver
        await axios.post('/api/v1/admin/drivers', formData);
      }
      
      setShowForm(false);
      fetchDrivers();
    } catch (err) {
      console.error('Error saving driver:', err);
      setError('Failed to save driver. Please try again.');
      setLoading(false);
    }
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
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
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING">Pending</option>
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

  // Render driver list
  const renderDriverList = () => (
    <>
      <div className="admin-section-header">
        <h2>Manage Drivers</h2>
        <button className="add-button" onClick={handleAddDriver}>
          Add New Driver
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
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(driver => (
                <tr key={driver.id}>
                  <td>{driver.id}</td>
                  <td>{`${driver.firstName} ${driver.lastName}`}</td>
                  <td>{driver.email}</td>
                  <td>{driver.phone}</td>
                  <td>{driver.carDetails}</td>
                  <td>{driver.rating?.toFixed(1) || '0.0'}</td>
                  <td>{driver.ridesCount}</td>
                  <td>
                    <span className={`status-badge ${driver.status.toLowerCase()}`}>
                      {driver.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
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
      {loading && !showForm ? (
        <div className="loading-indicator">Loading data...</div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
        </div>
      ) : showForm ? (
        renderDriverForm()
      ) : (
        renderDriverList()
      )}
    </div>
  );
};

export default AdminDriverManagement; 