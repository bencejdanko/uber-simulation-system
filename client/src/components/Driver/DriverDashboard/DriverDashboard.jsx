import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetDriverByIdQuery, useUpdateDriverProfileMutation, useUpdateDriverLocationMutation, useSearchRidesQuery } from '../../../api/apiSlice';
import useDriverAuth from '../../../hooks/useDriverAuth'; // Import the driver auth hook
import RideItemWithFare from './RideItemWithFare'; // Import the new component
import './DriverDashboard.css';

// const DriverDashboard = ({ userId, latitude, longitude }) => { // userId prop removed
const DriverDashboard = ({ latitude, longitude }) => {
  const navigate = useNavigate();
  // Use the custom hook for driver authentication logic
  const { userId, authChecked, error: authError } = useDriverAuth('accessToken', '/login-driver');

// List of states for dropdown
  const statesList = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
    'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
    'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
  ];

  // Fetch driver data - skip if no userId or auth check not complete
  const { data: driverData, error: driverApiError, isLoading: driverLoading } = useGetDriverByIdQuery(userId, {
    skip: !userId || !authChecked,
  });
  // Fetch rides with status "REQUESTED"
  const { data: ridesResponse, error: ridesError, isLoading: ridesLoading } = useSearchRidesQuery({ status: "REQUESTED" }, {
    skip: !userId || !authChecked, // Also skip this if not authenticated
  });
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
        firstName: driverData.firstName || '',
        lastName: driverData.lastName || '',
        email: driverData.email || '',
        phoneNumber: driverData.phoneNumber || '',
        address: driverData.address || { street: '', city: '', state: '', zipCode: '' },
        carDetails: driverData.carDetails || { make: '', model: '', year: '', color: '', licensePlate: '' },
        introduction: driverData.introduction || { imageUrl: '', videoUrl: '' },
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
    if (!userId) {
        console.error("No user ID available for profile update.");
        // Optionally set an error state to display to the user
        return;
    }
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

  // Extract the actual rides array from the response
  const actualRides = ridesResponse?.rides;

  // The existing 'latestRide' and 'pickup' logic might be less relevant
  // if you are displaying a full list of requested rides.
  // Consider if this specific display is still needed or how it should interact
  // with the new list. For now, it will show the first ride from the "REQUESTED" list.
  const latestRide = actualRides?.[0];
  const pickup = latestRide?.pickupLocation;

  // Handle logout functionality
  const handleLogout = () => {
    // 1. Clear the stored token
    localStorage.removeItem('accessToken');
    console.log('Driver token removed.');

    // 2. Optional: Dispatch action to clear Redux auth state
    // dispatch(setDriverLoggedOut());

    // 3. Optional: Reset RTK Query state if needed (often clearing token is enough)
    // dispatch(apiSlice.util.resetApiState()); // Be cautious, resets ALL API state

    // 4. Redirect to login or home page
    navigate('/'); // Or navigate('/')
  };

  // Handle loading and auth states
  if (!authChecked) {
    return <div className="dashboard-loading"><p>Authenticating driver...</p></div>;
  }

  if (!userId) { // authChecked is true, but no userId (hook should have redirected)
    return <div className="dashboard-loading"><p>Session invalid. Redirecting to login...</p></div>;
  }

  // At this point, authChecked is true and userId is available.
  // Now handle API data loading and display.

  if (driverLoading) {
    return <div className="dashboard-loading"><p>Loading your dashboard...</p></div>;
  }

  if (driverApiError) {
    return <div className="dashboard-error"><p>Error loading driver data: {driverApiError.message || 'Please try again.'}</p></div>;
  }
  
  // Display authError from the hook if it exists
  if (authError) {
    return <div className="dashboard-error"><p>Authentication Error: {authError}</p></div>;
  }


  return (
    <div className="driver-dashboard-container">
      <h1>Welcome to the Driver Dashboard</h1>
      {/* ... existing driver info and edit form ... */}
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
              {/* ... existing form inputs ... */}
              <div>
                <label>First Name:</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label>Last Name:</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label>Phone:</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>

              <h3>Address</h3>
              <div>
                <label>Street:</label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label>City:</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label>State:</label>
                  <select
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                  >
                    <option value="">Select a state</option>
                    {statesList.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
              </div>
              <div>
                <label>Zip Code:</label>
                <input
                  type="text"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                />
              </div>

              <h3>Car Details</h3>
              <div>
                <label>Make:</label>
                <input
                  type="text"
                  name="carDetails.make"
                  value={formData.carDetails.make}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label>Model:</label>
                <input
                  type="text"
                  name="carDetails.model"
                  value={formData.carDetails.model}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label>Year:</label>
                <input
                  type="number"
                  name="carDetails.year"
                  value={formData.carDetails.year}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label>Color:</label>
                <input
                  type="text"
                  name="carDetails.color"
                  value={formData.carDetails.color}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label>License Plate:</label>
                <input
                  type="text"
                  name="carDetails.licensePlate"
                  value={formData.carDetails.licensePlate}
                  onChange={handleChange}
                />
              </div>

              <h3>Introduction</h3>
              <div>
                <label>Image URL:</label>
                <input
                  type="text"
                  name="introduction.imageUrl"
                  value={formData.introduction.imageUrl || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label>Video URL:</label>
                <input
                  type="text"
                  name="introduction.videoUrl"
                  value={formData.introduction.videoUrl || ''}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </button>
              <button type="button" onClick={handleCancel} disabled={isUpdating}>
                Cancel
              </button>
              {updateError && <p className="error-message">Update failed: {updateError.data?.message || updateError.error}</p>}
            </form>
          )}
        </div>
      )}

      {/* Section to display "REQUESTED" rides */}
      <div className="requested-rides">
        <h2>Requested Rides</h2>
        {ridesLoading && <p>Loading requested rides...</p>}
        {ridesError && <p className="error-message">Error loading rides: {ridesError.data?.message || ridesError.error || 'An unknown error occurred'}</p>}
        {actualRides && actualRides.length > 0 ? (
          <ul className="rides-list">
            {actualRides.map((ride) => (
              <RideItemWithFare key={ride._id || ride.id} ride={ride} />
            ))}
          </ul>
        ) : (
          !ridesLoading && !ridesError && <p>No rides currently requested.</p>
        )}
      </div>

      {/* This section might be redundant or need adjustment if you're listing all rides above */}

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
        {/* <button className="nav-button" onClick={() => navigate('/admin/dashboard')}>Admin Dashboard</button> */} {/* Drivers likely shouldn't see this */}
        <button className="nav-button logout-button" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default DriverDashboard;
