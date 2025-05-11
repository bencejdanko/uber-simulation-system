import React, { useState, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import './LocationSelection.css';

const LocationSelection = ({ onLocationSelect }) => {
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');

  const [pickupAutocomplete, setPickupAutocomplete] = useState(null);
  const [dropoffAutocomplete, setDropoffAutocomplete] = useState(null); // State for dropoff Autocomplete

  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null); // Ref for dropoff input

  const onLoadPickup = (autocompleteInstance) => {
    setPickupAutocomplete(autocompleteInstance);
  };

  const onLoadDropoff = (autocompleteInstance) => { // Handler for dropoff Autocomplete load
    setDropoffAutocomplete(autocompleteInstance);
  };

  const onPlaceChangedPickup = () => {
    if (pickupAutocomplete !== null) {
      const place = pickupAutocomplete.getPlace();
      if (place.geometry && place.geometry.location && place.formatted_address) {
        const newPickupLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address,
        };
        setPickupAddress(place.formatted_address);

        onLocationSelect((prevLocations) => ({
          ...prevLocations,
          pickup: newPickupLocation,
          // Preserve dropoff data (it might have lat/lng if already selected)
          dropoff: prevLocations.dropoff || { address: dropoffAddress, lat: null, lng: null },
        }));
      } else {
        console.warn('Pickup place selection did not return full geometry or address.');
        onLocationSelect((prevLocations) => ({
          ...prevLocations,
          pickup: { address: pickupAddress, lat: null, lng: null },
          dropoff: prevLocations.dropoff || { address: dropoffAddress, lat: null, lng: null },
        }));
      }
    }
  };

  const onPlaceChangedDropoff = () => { // Handler for dropoff place change
    if (dropoffAutocomplete !== null) {
      const place = dropoffAutocomplete.getPlace();
      if (place.geometry && place.geometry.location && place.formatted_address) {
        const newDropoffLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address,
        };
        setDropoffAddress(place.formatted_address);

        onLocationSelect((prevLocations) => ({
          ...prevLocations,
          // Preserve pickup data (it might have lat/lng if already selected)
          pickup: prevLocations.pickup || { address: pickupAddress, lat: null, lng: null },
          dropoff: newDropoffLocation,
        }));
      } else {
        console.warn('Dropoff place selection did not return full geometry or address.');
        onLocationSelect((prevLocations) => ({
          ...prevLocations,
          pickup: prevLocations.pickup || { address: pickupAddress, lat: null, lng: null },
          dropoff: { address: dropoffAddress, lat: null, lng: null },
        }));
      }
    }
  };

  const handlePickupInputChange = (e) => {
    const address = e.target.value;
    setPickupAddress(address);
    onLocationSelect((prevLocations) => ({
      ...prevLocations,
      pickup: { address, lat: null, lng: null },
      dropoff: prevLocations.dropoff || { address: dropoffAddress, lat: null, lng: null },
    }));
  };

  const handleDropoffInputChange = (e) => { // Handler for manual typing in dropoff input
    const address = e.target.value;
    setDropoffAddress(address);
    onLocationSelect((prevLocations) => ({
      ...prevLocations,
      pickup: prevLocations.pickup || { address: pickupAddress, lat: null, lng: null },
      dropoff: { address, lat: null, lng: null },
    }));
  };

  return (
    <div className="location-selection">
      <div className="search-container">
        <div className="form-group">
          <label htmlFor="pickup-location-input">Pickup Location</label>
          <Autocomplete
            onLoad={onLoadPickup}
            onPlaceChanged={onPlaceChangedPickup}
            // Optional: Add restrictions like country
            // options={{
            //   types: ['address'],
            //   componentRestrictions: { country: 'us' },
            // }}
          >
            <input
              id="pickup-location-input"
              type="text"
              value={pickupAddress}
              onChange={handlePickupInputChange}
              placeholder="Enter pickup address"
              className="location-input"
              ref={pickupInputRef}
            />
          </Autocomplete>
        </div>
        <div className="form-group">
          <label htmlFor="dropoff-location-input">Drop-off Location</label>
          <Autocomplete
            onLoad={onLoadDropoff}
            onPlaceChanged={onPlaceChangedDropoff}
            // Optional: Add restrictions like country
            // options={{
            //   types: ['address'],
            //   componentRestrictions: { country: 'us' },
            // }}
          >
            <input
              id="dropoff-location-input"
              type="text"
              value={dropoffAddress}
              onChange={handleDropoffInputChange}
              placeholder="Enter drop-off address"
              className="location-input"
              ref={dropoffInputRef}
            />
          </Autocomplete>
        </div>
      </div>
    </div>
  );
};

export default LocationSelection;