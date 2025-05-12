import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDriverForm.css';

const AdminCustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'ACTIVE'
  });

  // Fetch customers from API
  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/v1/admin/customers');
      if (response.data && response.data.data) {
        setCustomers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to fetch customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm) {
      fetchCustomers();
      return;
    }
    
    const filteredCustomers = customers.filter(customer => 
      customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    );
    
    setCustomers(filteredCustomers);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Show add customer form
  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      status: 'ACTIVE'
    });
    setShowForm(true);
  };

  // Show edit customer form
  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      status: customer.status
    });
    setShowForm(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (selectedCustomer) {
        // Update existing customer
        await axios.put(`/api/v1/admin/customers/${selectedCustomer.id}`, formData);
      } else {
        // Add new customer
        await axios.post('/api/v1/admin/customers', formData);
      }
      
      setShowForm(false);
      fetchCustomers();
    } catch (err) {
      console.error('Error saving customer:', err);
      setError('Failed to save customer. Please try again.');
      setLoading(false);
    }
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
  };

  // Render customer form
  const renderCustomerForm = () => (
    <div className="admin-form-container">
      <h3>{selectedCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
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
            {selectedCustomer ? 'Update Customer' : 'Add Customer'}
          </button>
        </div>
      </form>
    </div>
  );

  // Render customer list
  const renderCustomerList = () => (
    <>
      <div className="admin-section-header">
        <h2>Manage Customers</h2>
        <button className="add-button" onClick={handleAddCustomer}>
          Add New Customer
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
      
      {customers.length === 0 ? (
        <div className="no-data-message">No customers found.</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Rides</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id}>
                  <td>{customer.id}</td>
                  <td>{`${customer.firstName} ${customer.lastName}`}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.ridesCount || 0}</td>
                  <td>${(customer.totalSpent || 0).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${customer.status.toLowerCase()}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="edit-button" onClick={() => handleEditCustomer(customer)}>
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
    <div className="admin-customers-container">
      {loading && !showForm ? (
        <div className="loading-indicator">Loading data...</div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
        </div>
      ) : showForm ? (
        renderCustomerForm()
      ) : (
        renderCustomerList()
      )}
    </div>
  );
};

export default AdminCustomerManagement; 