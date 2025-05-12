import React, { useState, useEffect } from 'react';
import './AdminDashboard.css'; // Basic styling
import { useSearchRidesQuery } from '../../../api/apiSlice'; // Assuming apiSlice is correctly set up
import { getStateFromCoordinates } from '../../../utils/adminDashboardUtils';
import StateRidesChart from './AdminContainer/StateRidesChart'; // Import the new chart component

const AdminDashboard = () => {
  const [ridesByStateData, setRidesByStateData] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [processingError, setProcessingError] = useState(null);

  // Fetch all rides using RTK Query.
  // Adjust query parameters (limit, status) as needed for your definition of "all rides".
  const {
    data: ridesApiResponse,
    isLoading: isLoadingApiRides,
    isError: isApiErrorRides,
    error: apiErrorRidesObject,
  } = useSearchRidesQuery(
    { limit: 10000 }, // Example: Fetch up to 10000 completed rides
    // Remove { skip: ... } if this dashboard is always active or only shows this chart
  );

  useEffect(() => {
    const processRides = async () => {
      if (!ridesApiResponse || isLoadingApiRides) {
        // Still loading from API or no data yet
        return;
      }

      if (isApiErrorRides) {
        console.error("API Error fetching rides:", apiErrorRidesObject);
        setProcessingError(`Failed to load ride data from API: ${apiErrorRidesObject?.data?.message || apiErrorRidesObject?.status || 'Unknown API error'}`);
        setRidesByStateData([]);
        return;
      }

      setIsGeocoding(true);
      setProcessingError(null);

      let ridesToProcess = [];
      // Determine the actual array of rides from the API response structure
      if (ridesApiResponse && Array.isArray(ridesApiResponse.data)) {
        ridesToProcess = ridesApiResponse.data;
      } else if (ridesApiResponse && Array.isArray(ridesApiResponse.rides)) {
        ridesToProcess = ridesApiResponse.rides;
      } else if (Array.isArray(ridesApiResponse)) {
        ridesToProcess = ridesApiResponse;
      } else {
        console.warn("Rides data for state chart is not in an expected array format:", ridesApiResponse);
        setProcessingError("Unexpected ride data format from API.");
        setRidesByStateData([]);
        setIsGeocoding(false);
        return;
      }

      if (ridesToProcess.length === 0) {
        setRidesByStateData([]);
        setIsGeocoding(false);
        return;
      }
      
      const stateCounts = {};
      let geocodingFailed = false;

      // WARNING: Geocoding many rides client-side can be slow and hit API limits.
      // Consider backend processing for production.
      for (const ride of ridesToProcess) {
        if (ride.pickupLocation?.coordinates?.length === 2) {
          const lat = ride.pickupLocation.coordinates[1];
          const lng = ride.pickupLocation.coordinates[0];
          try {
            const state = await getStateFromCoordinates(lat, lng);
            if (state === "API Key Missing" || state === "Geocoding Error") {
                geocodingFailed = true; // Mark failure to show a general error
            }
            stateCounts[state || "Unknown State"] = (stateCounts[state || "Unknown State"] || 0) + 1;
          } catch (err) {
            console.error("Error in getStateFromCoordinates call:", err);
            stateCounts["Geocoding Error"] = (stateCounts["Geocoding Error"] || 0) + 1;
            geocodingFailed = true;
          }
        } else {
          stateCounts["Invalid Location"] = (stateCounts["Invalid Location"] || 0) + 1;
        }
      }
      
      if (geocodingFailed) {
        setProcessingError("Some ride locations could not be processed. Data may be incomplete.");
      }

      setRidesByStateData(
        Object.entries(stateCounts).map(([name, count]) => ({ name, count }))
      );
      setIsGeocoding(false);
    };

    processRides();
  }, [ridesApiResponse, isLoadingApiRides, isApiErrorRides, apiErrorRidesObject]);

  // Determine overall loading state for the chart
  const chartIsLoading = isLoadingApiRides || isGeocoding;
  const chartError = processingError || (isApiErrorRides ? `API Error: ${apiErrorRidesObject?.data?.message || apiErrorRidesObject?.status}` : null);

  return (
    <div className="admin-dashboard-container">
      <header className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
        <h2>Rides by State Analysis</h2>
      </header>
      <main className="admin-dashboard-content">
        <p className="info-text">
          This chart displays the total number of rides originating from each state.
          Ride locations are determined using Google Maps Geocoding API.
        </p>
        <p className="warning-text">
          <strong>Note:</strong> Client-side geocoding for a large number of rides can be slow and may be subject to API rate limits. For production systems with many rides, consider processing and aggregating this data on the backend.
        </p>
        <StateRidesChart
          data={ridesByStateData}
          isLoading={chartIsLoading}
          error={chartError}
        />
      </main>
    </div>
  );
};

export default AdminDashboard;