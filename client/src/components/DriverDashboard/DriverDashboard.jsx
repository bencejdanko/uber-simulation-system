import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetDriverByIdQuery, useGetRidesByDriverQuery, useUpdateDriverProfileMutation, useUpdateDriverLocationMutation, useSearchRidesQuery } from '../../api/apiSlice';
import './DriverDashboard.css';

const DriverDashboard = ({ userId }) => {
  const navigate = useNavigate();

  // Fetch driver data
  const { data: driverData, error, isLoading } = useGetDriverByIdQuery(userId);
  // const { data: rides, error: ridesError, isLoading: ridesLoading } = useGetRidesByDriverQuery(userId);
  const { data: rides, error: ridesError, isLoading: ridesLoading } = useSearchRidesQuery({ status: "PENDING" });
  const [updateDriverLocation] = useUpdateDriverLocationMutation();
  const [updateDriverProfile, { isLoading: isUpdating, error: updateError }] = useUpdateDriverProfileMutation();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    carDetails: {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: ''
    },
    introduction: {
      imageUrl: '',
      videoUrl: ''
    },
    currentLocation: {
      latitude: '',
      longitude: ''
    }
  });

  const [isEditing, setIsEditing] = useState(false); // Track whether we are in edit mode
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Fetch driver data to populate the form when available
  useEffect(() => {
    if (driverData) {
      setFormData({
        firstName: driverData.firstName,
        lastName: driverData.lastName,
        email: driverData.email,
        phoneNumber: driverData.phoneNumber,
        address: driverData.address || {},
        carDetails: driverData.carDetails || {},
        introduction: driverData.introduction || {},
        currentLocation: {
          latitude: driverData.currentLocation?.coordinates?.[1] || '',
          longitude: driverData.currentLocation?.coordinates?.[0] || ''
        }
      });
    }
  }, [driverData]);

  // Handle input change for form data
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address')) {
      setFormData((prevData) => ({
        ...prevData,
        address: {
          ...prevData.address,
          [name.split('.')[1]]: value
        }
      }));
    } else if (name.startsWith('carDetails')) {
      setFormData((prevData) => ({
        ...prevData,
        carDetails: {
          ...prevData.carDetails,
          [name.split('.')[1]]: value
        }
      }));
    } else if (name.startsWith('introduction')) {
      setFormData((prevData) => ({
        ...prevData,
        introduction: {
          ...prevData.introduction,
          [name.split('.')[1]]: value
        }
      }));
    } else if (name.startsWith('currentLocation')) {
      setFormData((prevData) => ({
        ...prevData,
        currentLocation: {
          ...prevData.currentLocation,
          [name.split('.')[1]]: value
        }
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  // Handle profile update form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateDriverProfile({ driverId: userId, data: formData });
    setIsEditing(false);
  };

  // Handle cancel editing
  const handleCancel = () => {
    setFormData({
      firstName: driverData.firstName,
      lastName: driverData.lastName,
      email: driverData.email,
      phoneNumber: driverData.phoneNumber,
      address: driverData.address || {},
      carDetails: driverData.carDetails || {},
      introduction: driverData.introduction || {},
      currentLocation: {
        latitude: driverData.currentLocation?.coordinates?.[1] || '',
        longitude: driverData.currentLocation?.coordinates?.[0] || ''
      }
    });
    setIsEditing(false);
  };

  // Handle geolocation to get the current location of the device
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(coords);
          setFormData((prevData) => ({
            ...prevData,
            currentLocation: coords
          }));
          // Optionally send location update to backend
          updateDriverLocation({ id: userId, ...coords });
        },
        (error) => {
          console.error("Geolocation error:", error.message);
          setLocationError(error.message);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocationError("Geolocation not supported by this browser.");
    }
  }, [userId, updateDriverLocation]);

  // Get the most recent ride (assumes first is latest)
  const latestRide = rides?.[0];
  const pickup = latestRide?.pickupLocation;

  // Handle logout functionality
  const handleLogout = () => {
    localStorage.removeItem('driverToken');
    navigate('/'); // Redirect to home or login
  };

  return (
    <div className="driver-dashboard-container">
      <h1>Welcome to the Driver Dashboard</h1>
      <p>This is the dashboard for drivers.</p>
      {isLoading && <p>Loading driver data...</p>}
      {error && <p>Error loading driver data: {error.message}</p>}

      {/* Display driver basic info */}
      {driverData && (
        <div className="driver-info">
          <h2>Driver Information</h2>
          {!isEditing ? (
            <div>
              <p><strong>Name:</strong> {driverData.firstName} {driverData.lastName}</p>
              <p><strong>Email:</strong> {driverData.email}</p>
              <p><strong>Phone:</strong> {driverData.phoneNumber}</p>
              <button onClick={() => setIsEditing(true)}>Edit Profile</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Form fields for profile editing */}
              <div>
                <label>First Name:</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} />
              </div>
              <div>
                <label>Last Name:</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
              </div>
              {/* More input fields for profile details */}
              <button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </button>
              <button type="button" onClick={handleCancel} disabled={isUpdating}>Cancel</button>
              {updateError && <p>Error updating profile: {updateError.message}</p>}
            </form>
          )}
        </div>
      )}

      {ridesLoading && <p>Loading ride data...</p>}
      {ridesError && <p>Error loading ride data: {ridesError.message}</p>}
      {pickup && (
        <div className="customer-location">
          <h3>Customer Pickup Location</h3>
          <p>Latitude: {pickup.latitude}</p>
          <p>Longitude: {pickup.longitude}</p>
        </div>
      )}

      {location && (
        <div className="device-location">
          <h3>Your Current Device Location</h3>
          <p>Latitude: {location.latitude}</p>
          <p>Longitude: {location.longitude}</p>
        </div>
      )}
      {locationError && <p style={{ color: 'red' }}>{locationError}</p>}

      <div className="navigation-buttons">
        <button className="nav-button" onClick={() => navigate('/')}>Home</button>
        <button className="nav-button" onClick={() => navigate('/driver/manage-rides')}>Manage Rides</button>
        <button className="nav-button" onClick={() => navigate('/driver/earnings')}>Driver Earnings</button>
        <button className="nav-button" onClick={() => navigate('/admin/dashboard')}>Admin Dashboard</button>
        <button className="nav-button logout-button" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default DriverDashboard;
