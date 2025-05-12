import axios from 'axios';

// Ensure you have REACT_APP_GOOGLE_MAPS_API_KEY in your .env file
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

export const getStateFromCoordinates = async (lat, lng) => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("Google Maps API Key is missing. Please set REACT_APP_GOOGLE_MAPS_API_KEY.");
    return "API Key Missing";
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&result_type=administrative_area_level_1`;

  try {
    const response = await axios.get(url);
    if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
      // Iterate through results to find the state component
      for (const result of response.data.results) {
        const stateComponent = result.address_components.find(comp =>
          comp.types.includes("administrative_area_level_1")
        );
        if (stateComponent) {
          return stateComponent.long_name; // Or short_name
        }
      }
      // Fallback if not found in preferred results but geocoding was OK
      if (response.data.results[0]?.address_components) {
         const fallbackStateComponent = response.data.results[0].address_components.find(comp => comp.types.includes("administrative_area_level_1"));
         if (fallbackStateComponent) return fallbackStateComponent.long_name;
      }
      console.warn(`Could not determine state for coordinates: ${lat},${lng}. Result:`, response.data.results[0]);
      return "Unknown State";
    } else {
      console.warn(`Geocoding API error or no results for state at ${lat},${lng}: ${response.data.status}`, response.data.error_message);
      return "Unknown State";
    }
  } catch (error) {
    console.error(`Error during geocoding for state at ${lat},${lng}:`, error);
    return "Geocoding Error";
  }
};

// Example COLORS for charts (if you use PieChart elsewhere, or for BarChart variety)
export const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8A2BE2', '#FF69B4'];

export const getCityFromCoordinates = async (lat, lng) => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Google Maps API Key is missing.");
    return "API Key Missing";
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&result_type=locality`;
  try {
    const response = await axios.get(url);
    if (response.data.status === 'OK' && response.data.results[0]) {
      const localityComponent = response.data.results[0].address_components.find(comp => comp.types.includes("locality"));
      return localityComponent ? localityComponent.long_name : "Unknown City";
    }
    return "Unknown City";
  } catch (error) {
    console.error("Error fetching city from coordinates:", error);
    return "Geocoding Error";
  }
};