import React, { useState } from 'react';
import './LocationSelection.css';

const LocationSelection = ({ onLocationSelect }) => {
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');

  const handlePickupChange = (e) => {
    const address = e.target.value;
    setPickupAddress(address);
    onLocationSelect({
      pickup: { address },
      dropoff: { address: dropoffAddress }
    });
  };

  const handleDropoffChange = (e) => {
    const address = e.target.value;
    setDropoffAddress(address);
    onLocationSelect({
      pickup: { address: pickupAddress },
      dropoff: { address }
    });
  };

  return (
    <div className="location-selection">
      <div className="search-container">
        <div className="form-group">
          <label>Pickup Location</label>
          <input
            type="text"
            value={pickupAddress}
            onChange={handlePickupChange}
            placeholder="Enter pickup address"
            className="location-input"
          />
        </div>
        <div className="form-group">
          <label>Drop-off Location</label>
          <input
            type="text"
            value={dropoffAddress}
            onChange={handleDropoffChange}
            placeholder="Enter drop-off address"
            className="location-input"
          />
        </div>
      </div>
    </div>
  );
};

export default LocationSelection; 