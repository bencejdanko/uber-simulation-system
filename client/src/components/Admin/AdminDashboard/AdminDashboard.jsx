import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import axios from 'axios'; // Still used for other overview stats not covered by this specific RTK query
import { io } from 'socket.io-client';

// Import RTK Query hook
import { useListRidesQuery } from '../../../api/apiSlice'; // Adjusted path if apiSlice is in src/api

// Import sub-components
import AdminHeader from './AdminContainer/AdminHeader';
import AdminNavigationTabs from './AdminContainer/AdminNavigationTabs';
import OverviewTabContent from './AdminContainer/OverviewTabContent';
import BillingTabContent from './AdminContainer/BillingTabContent';
import AdminFooter from './AdminContainer/AdminFooter';

// Management components for other tabs
import AdminDriverManagement from './AdminDriverManagement';
import AdminCustomerManagement from './AdminCustomerManagement';
import AdminRideManagement from './AdminRideManagement';

// Utilities
import { getCityFromCoordinates } from '../../../utils/adminDashboardUtils';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [statistics, setStatistics] = useState({
    totalRides: 0, totalDrivers: 0, totalCustomers: 0,
    totalRevenue: 0, activeDrivers: 0, activeCustomers: 0
  });
  const [ridesByCity, setRidesByCity] = useState([]);
  const [ridesByHour, setRidesByHour] = useState([]);
  const [revenueByDay, setRevenueByDay] = useState([]);
  const [billingData, setBillingData] = useState([]);
  const [billSearchTerm, setBillSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false); // Specific loading for the geocoding process
  const [error, setError] = useState(null);

  const [timeRange, setTimeRange] = useState('daily');
  const [socket, setSocket] = useState(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState(true);

  // RTK Query for fetching rides list for the city chart
  // Fetches a list of rides. We'll process these for the city chart.
  // The `limit` param is an example; adjust based on your API and needs.
  const {
    data: ridesApiResponse, // This will contain the API response (e.g., { data: [rides...] } or [rides...])
    isLoading: isLoadingApiRides, // True if the listRides API call is in progress
    isFetching: isFetchingApiRides, // True if refetching
    isError: isApiErrorRides,     // True if the listRides API call failed
    error: apiErrorRidesObject,   // Error object from the listRides API call
  } = useListRidesQuery(
    { limit: 1000, /* other params like status, dateRange if your API supports them */ },
    { skip: activeTab !== 'overview' } // Skip query if not on overview tab
  );

  // Initialize Socket.io connection (existing logic)
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_ADMIN_SERVICE_URL || 'http://localhost:8001');
    newSocket.on('connect', () => console.log('Connected to admin service socket'));
    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Real-time updates are currently unavailable.');
    });
    setSocket(newSocket);
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  // Set up real-time data update listeners (existing logic)
  useEffect(() => {
    if (!socket || !realtimeUpdates) return;
    socket.on('dashboard-update:overview', (data) => setStatistics(data));
    socket.on('dashboard-update:rides', (data) => {
      // If backend sends pre-aggregated city data via socket, you might use it here.
      // Otherwise, client-side processing from ridesApiResponse will handle it.
      // if (data.ridesByCity) setRidesByCity(data.ridesByCity); 
      if (data.ridesByHour) setRidesByHour(data.ridesByHour);
    });
    socket.on('dashboard-update:billing', (data) => {
      if (data.billingData) setBillingData(prev => {
        const newData = [...prev];
        data.billingData.forEach(bill => {
          const existingIndex = newData.findIndex(b => (b.id || b._id) === (bill.id || bill._id));
          if (existingIndex >= 0) newData[existingIndex] = bill;
          else newData.unshift(bill);
        });
        return newData;
      });
    });
    return () => {
      socket.off('dashboard-update:overview');
      socket.off('dashboard-update:rides');
      socket.off('dashboard-update:billing');
    };
  }, [socket, realtimeUpdates]);

  // Effect for processing fetched rides (from RTK Query) for the city chart
  useEffect(() => {
    const processRidesForCityChart = async () => {
      if (activeTab !== 'overview' || isLoadingApiRides || isFetchingApiRides || !ridesApiResponse) {
        // If still loading or no data, or not on the right tab, do nothing or clear previous.
        if (activeTab === 'overview' && !isLoadingApiRides && !isFetchingApiRides && !ridesApiResponse && !isApiErrorRides) {
            setRidesByCity([]); // No data from API, clear chart
        }
        setGeocodingLoading(false);
        return;
      }

      if (isApiErrorRides) {
        console.error("Error fetching rides for city chart:", apiErrorRidesObject);
        setError("Failed to load ride data for city chart.");
        setRidesByCity([]);
        setGeocodingLoading(false);
        return;
      }
      
      setGeocodingLoading(true);
      setError(null); // Clear previous general errors

      // Determine the actual array of rides from the API response structure
      let ridesToProcess = [];
      if (ridesApiResponse && Array.isArray(ridesApiResponse.data)) { // e.g., { success: true, data: [...] }
        ridesToProcess = ridesApiResponse.data;
      } else if (ridesApiResponse && Array.isArray(ridesApiResponse.rides)) { // e.g., { rides: [...], total: ... }
        ridesToProcess = ridesApiResponse.rides;
      } else if (Array.isArray(ridesApiResponse)) { // e.g., API returns [...] directly
        ridesToProcess = ridesApiResponse;
      } else {
        console.warn("Rides data for city chart is not in an expected array format:", ridesApiResponse);
        setRidesByCity([]);
        setGeocodingLoading(false);
        return;
      }

      if (ridesToProcess.length > 0) {
        const cityCounts = {};
        try {
          // WARNING: This loop can be very slow and API-intensive for many rides.
          for (const ride of ridesToProcess) {
            if (ride.pickupLocation?.coordinates?.length === 2) {
              const lat = ride.pickupLocation.coordinates[1];
              const lng = ride.pickupLocation.coordinates[0];
              const city = await getCityFromCoordinates(lat, lng); // Async call
              cityCounts[city || "Unknown City"] = (cityCounts[city || "Unknown City"] || 0) + 1;
            }
          }
          setRidesByCity(Object.entries(cityCounts).map(([city, value]) => ({ city, value })));
        } catch (geoError) {
          console.error('Error during geocoding process:', geoError);
          setError('An error occurred while determining ride locations.');
          setRidesByCity([]); // Clear chart data on geocoding error
        }
      } else {
        setRidesByCity([]); // No rides to process
      }
      setGeocodingLoading(false);
    };

    processRidesForCityChart();
  }, [ridesApiResponse, activeTab, isLoadingApiRides, isFetchingApiRides, isApiErrorRides]); // Dependencies

  // Fetch other data for Overview Tab (stats, hourly, revenue) - using axios for now
  useEffect(() => {
    const fetchOtherOverviewData = async () => {
      if (activeTab !== 'overview') return;
      
      // This loading is for the axios calls, distinct from RTK Query or geocoding
      setOverviewLoading(true); 
      // setError(null); // Keep existing error state unless specifically overriding

      try {
        // These are fetched in parallel
        const [statsRes, hourRes, revenueRes] = await Promise.all([
          axios.get('/api/v1/admin/statistics/overview'),
          axios.get(`/api/v1/admin/statistics/rides-by-hour?timeRange=${timeRange}`),
          axios.get(`/api/v1/admin/statistics/revenue-by-day?timeRange=${timeRange}`)
        ]);

        if (statsRes.data) setStatistics(statsRes.data);
        if (hourRes.data) setRidesByHour(hourRes.data);
        if (revenueRes.data) setRevenueByDay(revenueRes.data);

      } catch (err) {
        console.error('Error fetching other overview data:', err);
        setError(prevError => prevError || 'Failed to fetch some overview analytics.'); // Append or set error
      } finally {
        setOverviewLoading(false);
      }
    };
    fetchOtherOverviewData();
  }, [activeTab, timeRange]);

  // Fetch data for Billing Tab (existing logic)
  useEffect(() => {
    const fetchBillingData = async () => {
      if (activeTab !== 'billing') return;
      setBillingLoading(true);
      // setError(null); // Keep existing error state
      try {
        const response = await axios.get('/api/v1/admin/bills', { params: { page: 1, limit: 20, search: billSearchTerm } });
        if (response.data && response.data.data) setBillingData(response.data.data);
        else setBillingData([]);
      } catch (err) {
        console.error('Error fetching billing data:', err);
        setError(prevError => prevError || 'Failed to fetch billing data.');
        setBillingData([]);
      } finally {
        setBillingLoading(false);
      }
    };
    fetchBillingData();
  }, [activeTab, billSearchTerm]);

  const handleTabChange = (tab) => setActiveTab(tab);
  const handleTimeRangeChange = (range) => setTimeRange(range);
  const toggleRealtimeUpdates = () => setRealtimeUpdates(!realtimeUpdates);

  const handleBillSearchSubmit = (e) => e.preventDefault(); // useEffect handles re-fetch

  const renderTabContent = () => {
    // Determine overall loading state for the current tab
    let currentTabLoading = false;
    if (activeTab === 'overview') {
      // Overview loading includes API call for rides, geocoding, and other stats
      currentTabLoading = isLoadingApiRides || isFetchingApiRides || geocodingLoading || overviewLoading;
    } else if (activeTab === 'billing') {
      currentTabLoading = billingLoading;
    }
    // Add conditions for other tabs if they have specific loading states

    if (currentTabLoading) return <div className="loading-indicator">Loading {activeTab} data...</div>;
    if (error) return <div className="error-message"><p>{error}</p></div>; // Display general error if present

    switch (activeTab) {
      case 'overview':
        return <OverviewTabContent 
                  statistics={statistics}
                  ridesByCity={ridesByCity}
                  ridesByHour={ridesByHour}
                  revenueByDay={revenueByDay}
                  timeRange={timeRange}
                  onTimeRangeChange={handleTimeRangeChange}
                  // Pass specific loading/error for sub-sections if needed, or rely on overall
                  loading={isLoadingApiRides || isFetchingApiRides || geocodingLoading || overviewLoading} 
                  error={isApiErrorRides ? (apiErrorRidesObject?.data?.message || 'Error loading ride locations') : error}
               />;
      case 'billing':
        return <BillingTabContent
                  billingData={billingData}
                  selectedBill={selectedBill}
                  billSearchTerm={billSearchTerm}
                  onBillSearchTermChange={setBillSearchTerm}
                  onBillSearchSubmit={handleBillSearchSubmit}
                  onViewBill={setSelectedBill}
                  onClearSelectedBill={() => setSelectedBill(null)}
                  loading={billingLoading}
                  error={error && activeTab === 'billing' ? error : null}
               />;
      case 'drivers':
        return <AdminDriverManagement />;
      case 'customers':
        return <AdminCustomerManagement />;
      case 'rides':
        return <AdminRideManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="admin-dashboard-container">
      <AdminHeader 
        realtimeUpdates={realtimeUpdates} 
        toggleRealtimeUpdates={toggleRealtimeUpdates} 
      />
      <AdminNavigationTabs 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
      <div className="admin-dashboard-content">
        {renderTabContent()}
      </div>
      <AdminFooter />
    </div>
  );
};

export default AdminDashboard;
