import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGetDriverByIdQuery, useUpdateDriverProfileMutation } from '../../../api/apiSlice';
import useDriverAuth from '../../../hooks/useDriverAuth'; // Assuming you have a useDriverAuth hook
import './DriverProfilePage.css';

// Helper function to get nested values safely
const getNestedValue = (obj, path, defaultValue = '') => {
  if (!obj || !path) return defaultValue;
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    result = result?.[key];
    if (result === undefined || result === null) return defaultValue;
  }
  return result;
};

// Basic validation (can be expanded)
const validateRequired = (value) => {
  if (!value || String(value).trim() === '') return 'This field is required.';
  return '';
};

const DriverProfilePage = () => {
  const navigate = useNavigate();
  const { userId, authChecked, error: authError } = useDriverAuth('accessToken', '/login-driver'); // Adjust if your hook is different

  const [updateDriverProfile, { isLoading: isUpdating, error: updateApiError }] = useUpdateDriverProfileMutation();

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
    carDetails: {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: '',
    },
    introduction: {
      imageUrl: '',
      videoUrl: '',
    },
  };

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});

  const { data: driverData, error: driverFetchError, isLoading: driverLoading } = useGetDriverByIdQuery(userId, {
    skip: !userId || !authChecked,
  });

  useEffect(() => {
    if (driverData && !isEditing) {
      setFormData({
        firstName: driverData.firstName || '',
        lastName: driverData.lastName || '',
        email: driverData.email || '',
        phoneNumber: driverData.phoneNumber || '',
        address: driverData.address || initialFormData.address,
        carDetails: driverData.carDetails || initialFormData.carDetails,
        introduction: driverData.introduction || initialFormData.introduction,
      });
    } else if (!driverData && !isEditing) {
      setFormData(initialFormData);
    }
  }, [driverData, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split('.');
    
    setFormData((prev) => {
      const newFormData = { ...prev };
      let currentLevel = newFormData;
      for (let i = 0; i < keys.length - 1; i++) {
        currentLevel[keys[i]] = { ...currentLevel[keys[i]] };
        currentLevel = currentLevel[keys[i]];
      }
      currentLevel[keys[keys.length - 1]] = value;
      return newFormData;
    });

    if (isEditing) {
        // Basic live validation for required fields as an example
        if (name === 'firstName' || name === 'lastName' || name === 'email' || name === 'carDetails.licensePlate') {
            setFormErrors(prev => ({...prev, [name]: validateRequired(value)}));
        }
    }
  };

  const handleEdit = () => {
    if (driverData) {
      // Re-populate form with latest driverData to ensure fresh data for editing
      setFormData({
        firstName: driverData.firstName || '',
        lastName: driverData.lastName || '',
        email: driverData.email || '',
        phoneNumber: driverData.phoneNumber || '',
        address: driverData.address || initialFormData.address,
        carDetails: driverData.carDetails || initialFormData.carDetails,
        introduction: driverData.introduction || initialFormData.introduction,
      });
    }
    setIsEditing(true);
    setFormErrors({}); // Clear errors when starting to edit
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormErrors({}); // Clear errors on cancel
    if (driverData) {
      // Reset form to original driver data
      setFormData({
        firstName: driverData.firstName || '',
        lastName: driverData.lastName || '',
        email: driverData.email || '',
        phoneNumber: driverData.phoneNumber || '',
        address: driverData.address || initialFormData.address,
        carDetails: driverData.carDetails || initialFormData.carDetails,
        introduction: driverData.introduction || initialFormData.introduction,
      });
    } else {
      setFormData(initialFormData);
    }
  };

  const validateForm = () => {
    const errors = {};
    errors.firstName = validateRequired(formData.firstName);
    errors.lastName = validateRequired(formData.lastName);
    errors.email = validateRequired(formData.email); // Add email format validation if needed
    errors['carDetails.licensePlate'] = validateRequired(formData.carDetails.licensePlate);
    // Add more validations as needed

    const validErrors = Object.fromEntries(Object.entries(errors).filter(([_, value]) => value !== ''));
    setFormErrors(validErrors);
    return Object.keys(validErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      console.error("Validation Error: Cannot save profile due to form errors.");
      return;
    }

    if (!userId) {
      console.error("User ID not found. Cannot save profile.");
      return;
    }
    try {
      // The updateDriverProfile mutation expects { driverId, data }
      await updateDriverProfile({ driverId: userId, data: formData }).unwrap();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      // API error is already handled by updateApiError state
    }
  };

  if (!authChecked) {
    return <div className="profile-loading"><p>Authenticating...</p></div>;
  }

  if (!userId && authChecked && !authError) {
    return <div className="profile-loading"><p>Session invalid or user not found. Redirecting...</p></div>;
  }
  
  if (authError) {
     // useDriverAuth should handle redirection, this is a fallback display
    return <div className="profile-error"><p>Authentication Error: {typeof authError === 'string' ? authError : JSON.stringify(authError)}</p></div>;
  }

  if (driverLoading) return <div className="profile-loading"><p>Loading profile...</p></div>;

  const renderDetailItem = (label, valueKey, placeholder = 'N/A', inputType = 'text', sectionKey = '') => {
    const fullKey = sectionKey ? `${sectionKey}.${valueKey}` : valueKey;
    const formValue = getNestedValue(formData, fullKey, '');
    const driverDisplayValue = getNestedValue(driverData, fullKey);
    const error = formErrors[fullKey];

    return (
      <div className="profile-detail-item">
        <span className="detail-label">{label}:</span>
        {isEditing ? (
          <div className="input-wrapper">
            <input
              type={inputType}
              name={fullKey}
              value={formValue}
              onChange={handleInputChange}
              placeholder={`Enter ${label.toLowerCase()}`}
              className={`detail-value-input ${error ? 'input-error' : ''}`}
            />
            {error && <span className="validation-error-inline">{error}</span>}
          </div>
        ) : (
          <span className="detail-value">{driverDisplayValue ?? placeholder}</span>
        )}
      </div>
    );
  };
  
  // List of states for dropdown - can be moved to a constants file
  const statesList = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
    'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
    'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
  ];

  const renderSelectDetailItem = (label, valueKey, sectionKey = '') => {
    const fullKey = sectionKey ? `${sectionKey}.${valueKey}` : valueKey;
    const formValue = getNestedValue(formData, fullKey, '');
    const driverDisplayValue = getNestedValue(driverData, fullKey);
    const error = formErrors[fullKey];

    return (
      <div className="profile-detail-item">
        <span className="detail-label">{label}:</span>
        {isEditing ? (
          <div className="input-wrapper">
            <select
              name={fullKey}
              value={formValue}
              onChange={handleInputChange}
              className={`detail-value-input ${error ? 'input-error' : ''}`}
            >
              <option value="">Select State</option>
              {statesList.map(state => <option key={state} value={state}>{state}</option>)}
            </select>
            {error && <span className="validation-error-inline">{error}</span>}
          </div>
        ) : (
          <span className="detail-value">{driverDisplayValue || 'N/A'}</span>
        )}
      </div>
    );
  };


  return (
    <div className="driver-profile-page">
      <h2>My Driver Profile</h2>

      {driverFetchError && !isEditing && (
        <p className="error-message">Error loading profile: {driverFetchError.data?.message || driverFetchError.error}</p>
      )}
      {updateApiError && (
         <p className="error-message">Error saving profile: {updateApiError.data?.message || updateApiError.error}</p>
      )}

      <div className="profile-details-card">
        <h3>Personal Information</h3>
        {renderDetailItem('First Name', 'firstName')}
        {renderDetailItem('Last Name', 'lastName')}
        {renderDetailItem('Email', 'email', 'N/A', 'email')}
        {renderDetailItem('Phone Number', 'phoneNumber', 'N/A', 'tel')}
      </div>

      <div className="profile-details-card">
        <h3>Address</h3>
        {renderDetailItem('Street', 'street', 'N/A', 'text', 'address')}
        {renderDetailItem('City', 'city', 'N/A', 'text', 'address')}
        {renderSelectDetailItem('State', 'state', 'address')}
        {renderDetailItem('Zip Code', 'zipCode', 'N/A', 'text', 'address')}
      </div>

      <div className="profile-details-card">
        <h3>Car Details</h3>
        {renderDetailItem('Make', 'make', 'N/A', 'text', 'carDetails')}
        {renderDetailItem('Model', 'model', 'N/A', 'text', 'carDetails')}
        {renderDetailItem('Year', 'year', 'N/A', 'number', 'carDetails')}
        {renderDetailItem('Color', 'color', 'N/A', 'text', 'carDetails')}
        {renderDetailItem('License Plate', 'licensePlate', 'N/A', 'text', 'carDetails')}
      </div>
      
      <div className="profile-details-card">
        <h3>Introduction (Optional)</h3>
        {renderDetailItem('Image URL', 'imageUrl', 'N/A', 'url', 'introduction')}
        {renderDetailItem('Video URL', 'videoUrl', 'N/A', 'url', 'introduction')}
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
          <>
            <button 
              onClick={handleEdit}
              className="action-button submit-button"
            >
              Edit Profile
            </button>
            <Link to="/driver/dashboard" className="action-button submit-button">
              Back to Dashboard
            </Link>
          </>
        )}
      </div>
      {!driverData && !driverLoading && !driverFetchError && !isEditing && (
        <p>No profile data found. Click "Edit Profile" to add your details.</p>
      )}
    </div>
  );
};

export default DriverProfilePage;