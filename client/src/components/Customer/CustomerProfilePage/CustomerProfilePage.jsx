import React from 'react';
import { useParams } from 'react-router-dom'; // Or get userId from auth context/props
import { useGetCustomerByIdQuery } from '../../../api/apiSlice'; // Adjust path as needed
import './CustomerProfilePage.css';

const CustomerProfilePage = () => {
  // If you pass userId via URL like /customer/profile/:userId
  // const { userId: routeUserId } = useParams();
  // For now, let's assume userId is available from a global state/localStorage
  // or passed down. For simplicity, using a hardcoded or localStorage example.
  const userId = localStorage.getItem('userId'); // Replace with your actual userId source

  const { data: customerData, error: customerError, isLoading: customerLoading } = useGetCustomerByIdQuery(userId, {
    skip: !userId, // Skip query if no userId
  });

  if (!userId) {
    return (
      <div className="customer-profile-page">
        <h2>Customer Profile</h2>
        <p>User ID not found. Please log in.</p>
      </div>
    );
  }

  if (customerLoading) return <p>Loading profile...</p>;
  if (customerError) return <p>Error loading profile: {customerError.data?.message || customerError.error}</p>;

  return (
    <div className="customer-profile-page">
      <h2>My Profile</h2>
      {customerData ? (
        <div className="profile-details-card">
          <div className="profile-detail-item">
            <span className="detail-label">First Name:</span>
            <span className="detail-value">{customerData.firstName}</span>
          </div>
          <div className="profile-detail-item">
            <span className="detail-label">Last Name:</span>
            <span className="detail-value">{customerData.lastName}</span>
          </div>
          <div className="profile-detail-item">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{customerData.email}</span>
          </div>
          <div className="profile-detail-item">
            <span className="detail-label">Phone Number:</span>
            <span className="detail-value">{customerData.phoneNumber}</span>
          </div>
          {/* Add more fields as needed, e.g., address, registration date */}
          {/* You could also add an "Edit Profile" button here */}
        </div>
      ) : (
        <p>No profile data found.</p>
      )}
    </div>
  );
};

export default CustomerProfilePage;