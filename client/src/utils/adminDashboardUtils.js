import axios from 'axios';

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Helper function to get city from coordinates using Google Maps Geocoding API
export const getCityFromCoordinates = async (lat, lng) => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY; // Ensure this ENV variable is set
  if (!apiKey) {
    console.error("Google Maps API Key is missing. Please set REACT_APP_GOOGLE_MAPS_API_KEY.");
    // It's better to throw an error or return a clear indicator that the API key is missing
    // rather than proceeding, as the API call will fail.
    throw new Error("Google Maps API Key is missing");
  }
  // Using result_type=locality to specifically ask for city-level results
  // You might need to adjust result_type or parse different address components based on your needs
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&result_type=locality`;

  try {
    const response = await axios.get(url);
    if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
      // Iterate through address components to find the city (locality)
      for (const result of response.data.results) {
        const cityComponent = result.address_components.find(comp => comp.types.includes("locality"));
        if (cityComponent) {
          return cityComponent.long_name;
        }
      }
      // Fallback if locality is not found directly, try administrative_area_level_1 or other relevant types
      // This logic might need refinement based on how Google structures addresses for your target regions.
      const adminAreaLevel1 = response.data.results[0].address_components.find(comp => comp.types.includes("administrative_area_level_1"));
      if (adminAreaLevel1) return adminAreaLevel1.long_name; // This might be a state/province

      console.warn(`Could not determine city for ${lat},${lng}. Geocoding result:`, response.data.results[0]);
      return "Unknown Region"; // Fallback city
    } else {
      console.warn(`Geocoding API error or no results for ${lat},${lng}: ${response.data.status}`, response.data.error_message);
      return null; // Or "Unknown" if you prefer to categorize these
    }
  } catch (error) {
    console.error(`Error during geocoding for ${lat},${lng}:`, error);
    // Re-throw to allow the caller to handle it, or return a specific error indicator
    throw error;
  }
};