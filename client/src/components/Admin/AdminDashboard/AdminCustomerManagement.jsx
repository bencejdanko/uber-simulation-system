import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDriverForm.css';

const API_BASE_URL = 'http://localhost:3001/api/v1';

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
    status: 'active'
  });

  // Fetch customers from API
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/customers`);
      if (response.data && response.data.success) {
        setCustomers(response.data.data || []);
      } else {
        setError('Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Error fetching customers. Please try again.');
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
      status: 'active'
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
    setError(null);
    
    try {
      console.log('Form data:', formData);
      
      if (selectedCustomer) {
        // Update existing customer
        const response = await axios.put(`${API_BASE_URL}/admin/customers/${selectedCustomer._id}`, formData);
        if (response.data && response.data.success) {
          setShowForm(false);
          fetchCustomers();
        } else {
          setError(response.data?.error || 'Failed to update customer');
          setLoading(false);
        }
      } else {
        // Add new customer
        const response = await axios.post(`${API_BASE_URL}/admin/customers`, formData);
        if (response.data && response.data.success) {
          setShowForm(false);
          fetchCustomers();
        } else {
          setError(response.data?.error || 'Failed to add customer');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Error saving customer:', err);
      setError(err.response?.data?.error || 'Failed to save customer. Please try again.');
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
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer._id}>
                  <td>{customer._id}</td>
                  <td>{`${customer.firstName} ${customer.lastName}`}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
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