import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode
import { useGetCustomerByIdQuery, useUpdateCustomerMutation } from '../../../api/apiSlice'; // Adjust path and ensure useUpdateCustomerMutation exists
import './CustomerProfilePage.css';

const CustomerProfilePage = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [userId, setUserId] = useState(null); // State for userId from JWT
  const [authChecked, setAuthChecked] = useState(false); // State to track if auth check is complete

  // Mutation for updating customer profile
  const [updateCustomer, { isLoading: isUpdating, error: updateError }] = useUpdateCustomerMutation();

  const initialFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  };

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    const token = localStorage.getItem('customerToken'); // Use the same token key as in Dashboard
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken && decodedToken.sub) {
          setUserId(decodedToken.sub);
          console.log("Profile Page UserID from JWT (sub):", decodedToken.sub);
        } else {
          console.error("Profile Page: JWT 'sub' claim not found.");
          localStorage.removeItem('customerToken'); // Ensure consistent key
          navigate('/login-customer');
        }
      } catch (error) {
        console.error("Profile Page: Failed to decode JWT.", error);
        localStorage.removeItem('customerToken'); // Ensure consistent key
        navigate('/login-customer');
      }
    } else {
      console.log("Profile Page: No access token found.");
      navigate('/login-customer');
    }
    setAuthChecked(true);
  }, [navigate]);

  const { data: customerData, error: customerError, isLoading: customerLoading } = useGetCustomerByIdQuery(userId, {
    skip: !userId || !authChecked, // Skip query if no userId or auth check not done
  });

  useEffect(() => {
    if (customerData && !isEditing) {
      setFormData({
        firstName: customerData.firstName || '',
        lastName: customerData.lastName || '',
        email: customerData.email || '',
        phoneNumber: customerData.phoneNumber || '',
        address: customerData.address || '',
        city: customerData.city || '',
        state: customerData.state || '',
        zipCode: customerData.zipCode || '',
      });
    } else if (!customerData && !isEditing) {
      setFormData(initialFormData);
    }
  }, [customerData, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    if (customerData) {
      setFormData({
        firstName: customerData.firstName || '',
        lastName: customerData.lastName || '',
        email: customerData.email || '',
        phoneNumber: customerData.phoneNumber || '',
        address: customerData.address || '',
        city: customerData.city || '',
        state: customerData.state || '',
        zipCode: customerData.zipCode || '',
      });
    } else {
      setFormData(initialFormData);
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (customerData) {
      setFormData({
        firstName: customerData.firstName || '',
        lastName: customerData.lastName || '',
        email: customerData.email || '',
        phoneNumber: customerData.phoneNumber || '',
        address: customerData.address || '',
        city: customerData.city || '',
        state: customerData.state || '',
        zipCode: customerData.zipCode || '',
      });
    } else {
      setFormData(initialFormData);
    }
  };

  const handleSave = async () => {
    if (!userId) { // This check should now be more reliable
      console.error("User ID not found (from JWT). Cannot save profile.");
      return;
    }
    try {
      // Pass the customer's ID as 'id' to match what apiSlice expects
      await updateCustomer({ id: userId, ...formData }).unwrap(); 
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  if (!authChecked) {
    return <p>Authenticating...</p>; // Show authenticating message until token check is done
  }

  // If authChecked is true and still no userId, it means redirection should have happened
  if (!userId && authChecked) {
    return <p>Redirecting to login...</p>;
  }

  if (customerLoading) return <p>Loading profile...</p>;
  // Note: customerError display is handled further down to allow editing even on error

  const renderDetailItem = (label, valueKey, placeholder = 'N/A', inputType = 'text') => (
    <div className="profile-detail-item">
      <span className="detail-label">{label}:</span>
      {isEditing ? (
        <input
          type={inputType}
          name={valueKey}
          value={formData[valueKey]}
          onChange={handleInputChange}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="detail-value-input"
          disabled={valueKey === 'email' && !isEditing} // Example: Make email read-only when not editing
        />
      ) : (
        <span className="detail-value">{customerData?.[valueKey] || formData[valueKey] || placeholder}</span>
      )}
    </div>
  );

  return (
    <div className="customer-profile-page">
      <h2>My Profile</h2>

      {customerError && !isEditing && ( // Show fetch error only when not editing
        <p className="error-message">Error loading profile: {customerError.data?.message || customerError.error}</p>
      )}
      {updateError && (
         <p className="error-message">Error saving profile: {updateError.data?.message || updateError.error}</p>
      )}

      <div className="profile-details-card">
        {renderDetailItem('First Name', 'firstName')}
        {renderDetailItem('Last Name', 'lastName')}
        {renderDetailItem('Email', 'email', 'N/A', 'email')}
        {renderDetailItem('Phone Number', 'phoneNumber')}
        {renderDetailItem('Address', 'address')}
        {renderDetailItem('City', 'city')}
        {renderDetailItem('State', 'state')}
        {renderDetailItem('Zip Code', 'zipCode')}
      </div>

      <div className="profile-actions">
        {isEditing ? (
          <>
            <button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={handleCancel} disabled={isUpdating}>
              Cancel
            </button>
          </>
        ) : (
          <button onClick={handleEdit}>Edit Profile</button>
        )}
      </div>

      {!customerData && !isEditing && !customerLoading && !customerError && (
        <p>No profile data found. Click "Edit Profile" to add your details.</p>
      )}
    </div>
  );
};

export default CustomerProfilePage;