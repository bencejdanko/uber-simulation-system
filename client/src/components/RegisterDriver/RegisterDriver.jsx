import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterDriver.css';

const RegisterDriver = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    driverId: '',
    firstName: '',
    lastName: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    phoneNumber: '',
    email: '',
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
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Driver Registered:', formData);
    navigate('/driver/dashboard'); // Redirect to Driver Dashboard after registration
  };

  return (
    <div className="register-driver-container">
      <header className="register-driver-header">
        <h1>Driver Registration</h1>
      </header>
      <button className="home-button" onClick={() => navigate('/')}>
        Home
      </button>
      <form className="register-driver-form" onSubmit={handleSubmit}>
        <h2>Personal Information</h2>
        <label>
          Driver ID (SSN):
          <input
            type="text"
            name="driverId"
            value={formData.driverId}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          First Name:
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Last Name:
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
          />
        </label>

        <h2>Address</h2>
        <label>
          Street:
          <input
            type="text"
            name="address.street"
            value={formData.address.street}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          City:
          <input
            type="text"
            name="address.city"
            value={formData.address.city}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          State:
          <input
            type="text"
            name="address.state"
            value={formData.address.state}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Zip Code:
          <input
            type="text"
            name="address.zipCode"
            value={formData.address.zipCode}
            onChange={handleInputChange}
            required
          />
        </label>

        <h2>Contact Information</h2>
        <label>
          Phone Number:
          <input
            type="text"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </label>

        <h2>Car Details</h2>
        <label>
          Make:
          <input
            type="text"
            name="carDetails.make"
            value={formData.carDetails.make}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Model:
          <input
            type="text"
            name="carDetails.model"
            value={formData.carDetails.model}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Year:
          <input
            type="number"
            name="carDetails.year"
            value={formData.carDetails.year}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Color:
          <input
            type="text"
            name="carDetails.color"
            value={formData.carDetails.color}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          License Plate:
          <input
            type="text"
            name="carDetails.licensePlate"
            value={formData.carDetails.licensePlate}
            onChange={handleInputChange}
            required
          />
        </label>

        <h2>Introduction (Optional)</h2>
        <label>
          Image URL:
          <input
            type="url"
            name="introduction.imageUrl"
            value={formData.introduction.imageUrl}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Video URL:
          <input
            type="url"
            name="introduction.videoUrl"
            value={formData.introduction.videoUrl}
            onChange={handleInputChange}
          />
        </label>

        <button type="submit" className="submit-button">
          Register
        </button>
      </form>
    </div>
  );
};

export default RegisterDriver;