import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGetCustomerByIdQuery, useUpdateCustomerMutation } from '../../../api/apiSlice';
import useCustomerAuth from '../../../hooks/useCustomerAuth'; // Import the hook
import './CustomerProfilePage.css';

// Helper function to get nested values safely
const getNestedValue = (obj, path, defaultValue = undefined) => {
  if (!obj || !path) return defaultValue;
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    result = result?.[key];
    if (result === undefined) return defaultValue;
  }
  return result;
};

// Validation function for Zip Code
const validateZipCode = (zipCode) => {
  if (!zipCode) return ''; // No error if empty, allow optional field
  const zipCodeRegex = /^\d{5}(-\d{4})?$/;
  if (!zipCodeRegex.test(zipCode)) {
    return 'Invalid ZIP code. Use XXXXX or XXXXX-XXXX format.';
  }
  return ''; // No error
};

const CustomerProfilePage = () => {
  const navigate = useNavigate();
  // Use the custom hook for authentication logic
  const { userId, authChecked, error: authError } = useCustomerAuth('customerToken', '/login-customer');

  const [zipCodeError, setZipCodeError] = useState('');
  const [updateCustomer, { isLoading: isUpdating, error: updateError }] = useUpdateCustomerMutation();

  const initialFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
  };

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  // useEffect for auth is removed, handled by useCustomerAuth hook

  const { data: customerData, error: customerError, isLoading: customerLoading } = useGetCustomerByIdQuery(userId, {
    skip: !userId || !authChecked, // Skip query if no userId or auth check not complete
  });

  useEffect(() => {
    if (customerData && !isEditing) {
      setFormData({
        firstName: customerData.firstName || '',
        lastName: customerData.lastName || '',
        email: customerData.email || '',
        phoneNumber: customerData.phoneNumber || '',
        address: {
          street: customerData.address?.street || '',
          city: customerData.address?.city || '',
          state: customerData.address?.state || '',
          zipCode: customerData.address?.zipCode || '',
        },
      });
    } else if (!customerData && !isEditing) {
      // If there's no customerData (e.g., new user) and not editing, ensure form is initial
      setFormData(initialFormData);
    }
  }, [customerData, isEditing]); // initialFormData can be added if it's not stable

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
      if (name === 'address.zipCode') {
        setZipCodeError(validateZipCode(value));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleEdit = () => {
    if (customerData) {
      setFormData({
        firstName: customerData.firstName || '',
        lastName: customerData.lastName || '',
        email: customerData.email || '',
        phoneNumber: customerData.phoneNumber || '',
        address: {
          street: customerData.address?.street || '',
          city: customerData.address?.city || '',
          state: customerData.address?.state || '',
          zipCode: customerData.address?.zipCode || '',
        },
      });
      setZipCodeError(validateZipCode(customerData.address?.zipCode || '')); // Validate on edit
    } else {
      setFormData(initialFormData);
      setZipCodeError(''); // Clear error if no data
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setZipCodeError(''); // Clear zip code error on cancel
    if (customerData) {
      setFormData({
        firstName: customerData.firstName || '',
        lastName: customerData.lastName || '',
        email: customerData.email || '',
        phoneNumber: customerData.phoneNumber || '',
        address: {
          street: customerData.address?.street || '',
          city: customerData.address?.city || '',
          state: customerData.address?.state || '',
          zipCode: customerData.address?.zipCode || '',
        },
      });
    } else {
      setFormData(initialFormData);
    }
  };

  const handleSave = async () => {
    const currentZipCodeError = validateZipCode(formData.address.zipCode);
    setZipCodeError(currentZipCodeError);

    if (currentZipCodeError) {
      console.error("Validation Error: Cannot save profile due to invalid ZIP code.");
      return;
    }

    if (!userId) { // userId from the hook
      console.error("User ID not found. Cannot save profile.");
      // Optionally, display a message to the user or redirect
      return;
    }
    try {
      await updateCustomer({ id: userId, ...formData }).unwrap();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  if (!authChecked) {
    return <div className="profile-loading"><p>Authenticating...</p></div>;
  }

  if (!userId && authChecked) { // Check authError from hook if needed
    // The hook should have redirected. This is a fallback.
    // You can display authError if it exists: {authError && <p>{authError}</p>}
    return <div className="profile-loading"><p>Session invalid. Redirecting to login...</p></div>;
  }

  if (customerLoading) return <div className="profile-loading"><p>Loading profile...</p></div>;

  const renderDetailItem = (label, valueKey, placeholder = 'N/A', inputType = 'text') => {
    const formValue = getNestedValue(formData, valueKey, '');
    const customerDisplayValue = getNestedValue(customerData, valueKey);

    return (
      <div className="profile-detail-item">
        <span className="detail-label">{label}:</span>
        {isEditing ? (
          <input
            type={inputType}
            name={valueKey}
            value={formValue}
            onChange={handleInputChange}
            placeholder={`Enter ${label.toLowerCase()}`}
            className={`detail-value-input ${valueKey === 'address.zipCode' && zipCodeError ? 'input-error' : ''}`}
          />
        ) : (
          <span className="detail-value">{customerDisplayValue ?? placeholder}</span>
        )}
      </div>
    );
  };

  return (
    <div className="customer-profile-page">
      <h2>My Profile</h2>

      {/* Display authError from the hook if it exists and is relevant */}
      {authError && <p className="error-message">Authentication Error: {authError}</p>}
      
      {customerError && !isEditing && (
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
        {renderDetailItem('Street', 'address.street')}
        {renderDetailItem('City', 'address.city')}
        {renderDetailItem('State', 'address.state')}
        {renderDetailItem('Zip Code', 'address.zipCode')}
        {isEditing && zipCodeError && <p className="error-message validation-error">{zipCodeError}</p>}
      </div>

      <div className="profile-actions">
        {isEditing ? (
          <>
            <button 
              onClick={handleSave} 
              disabled={isUpdating}
              className="action-button submit-button"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              onClick={handleCancel} 
              disabled={isUpdating}
              className="action-button submit-button"
            >
              Cancel
            </button>
          </>
        ) : (
          <> {/* Wrap buttons in a fragment if there are multiple */}
            <button 
              onClick={handleEdit}
              className="action-button submit-button"
            >
              Edit Profile
            </button>
            <Link to="/customer/dashboard" className="action-button submit-button">
              Back to Dashboard
            </Link>
          </>
        )}
      </div>

      {!customerData && !isEditing && !customerLoading && !customerError && (
        <p>No profile data found. Click "Edit Profile" to add your details.</p>
      )}
    </div>
  );
};

export default CustomerProfilePage;