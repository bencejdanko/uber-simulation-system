import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import axios from 'axios';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import AdminDriverManagement from './AdminDriverManagement';
import AdminCustomerManagement from './AdminCustomerManagement';
import AdminRideManagement from './AdminRideManagement';

const API_BASE_URL = 'http://localhost:3001/api/v1';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [statistics, setStatistics] = useState({
    totalRides: 0,
    totalDrivers: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    activeDrivers: 0,
    activeCustomers: 0
  });
  const [ridesByCity, setRidesByCity] = useState([]);
  const [ridesByHour, setRidesByHour] = useState([]);
  const [revenueByDay, setRevenueByDay] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('daily');
  const [billingData, setBillingData] = useState([]);
  const [billSearchTerm, setBillSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [error, setError] = useState(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Initialize with a message instead of socket connection
  useEffect(() => {
    // Real-time updates are disabled
    console.log('Auto-refresh is enabled with interval:', refreshInterval);
  }, [refreshInterval]);

  // Simplify this useEffect to not use socket
  useEffect(() => {
    // Update realtimeUpdates based on refreshInterval
    setRealtimeUpdates(refreshInterval > 0);
    console.log('Auto-refresh is ' + (refreshInterval > 0 ? 'enabled' : 'disabled') + ' with interval:', refreshInterval);
  }, [refreshInterval]);

  // Fetch dashboard data from APIs
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch overview statistics
      const statsResponse = await axios.get(`${API_BASE_URL}/admin/statistics`);
      if (statsResponse.data && statsResponse.data.success) {
        console.log('Dashboard statistics updated:', statsResponse.data.data);
        setStatistics(statsResponse.data.data);
        setLastUpdated(new Date());
      }
      
      // Temporarily use mock data for other charts
      // since our mock server doesn't implement all endpoints yet
      setRidesByCity([
        { city: 'San Francisco', count: 120 },
        { city: 'New York', count: 85 },
        { city: 'Los Angeles', count: 65 },
        { city: 'Chicago', count: 45 },
        { city: 'Seattle', count: 35 }
      ]);
      
      setRidesByHour([
        { hour: '00:00', count: 5 },
        { hour: '01:00', count: 3 },
        { hour: '02:00', count: 2 },
        { hour: '03:00', count: 1 },
        { hour: '04:00', count: 1 },
        { hour: '05:00', count: 2 },
        { hour: '06:00', count: 10 },
        { hour: '07:00', count: 25 },
        { hour: '08:00', count: 40 },
        { hour: '09:00', count: 30 },
        { hour: '10:00', count: 20 },
        { hour: '11:00', count: 18 },
        { hour: '12:00', count: 25 },
        { hour: '13:00', count: 30 },
        { hour: '14:00', count: 22 },
        { hour: '15:00', count: 25 },
        { hour: '16:00', count: 35 },
        { hour: '17:00', count: 45 },
        { hour: '18:00', count: 40 },
        { hour: '19:00', count: 30 },
        { hour: '20:00', count: 22 },
        { hour: '21:00', count: 18 },
        { hour: '22:00', count: 12 },
        { hour: '23:00', count: 8 }
      ]);
      
      setRevenueByDay([
        { date: '2023-05-01', amount: 2500 },
        { date: '2023-05-02', amount: 2800 },
        { date: '2023-05-03', amount: 3200 },
        { date: '2023-05-04', amount: 2900 },
        { date: '2023-05-05', amount: 3500 },
        { date: '2023-05-06', amount: 4100 },
        { date: '2023-05-07', amount: 3800 }
      ]);
      
    } catch (error) {
      console.error('Error fetching statistics', error);
      // Use fallback data on error
      setStatistics({
        customerCount: 0,
        driverCount: 0,
        rideCount: 0,
        completedRides: 0,
        totalRevenue: 0,
        ridesByStatus: {
          requested: 0,
          accepted: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up polling for overview tab
  useEffect(() => {
    // Initial fetch
    fetchDashboardData();
    
    // Only set up interval if we're on the overview tab and refreshInterval > 0
    if (activeTab === 'overview' && refreshInterval > 0) {
      console.log(`Setting up auto-refresh every ${refreshInterval}ms`);
      const intervalId = setInterval(fetchDashboardData, refreshInterval);
      
      // Cleanup on unmount or when dependencies change
      return () => {
        console.log('Clearing auto-refresh interval');
        clearInterval(intervalId);
      };
    }
  }, [activeTab, refreshInterval, fetchDashboardData]);

  // Fetch billing data 
  useEffect(() => {
    const fetchBillingData = async () => {
      if (activeTab !== 'billing') return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching billing data...');
        const response = await axios.get(`${API_BASE_URL}/admin/bills`);
        
        if (response.data && response.data.success) {
          console.log('Billing data received:', response.data.data);
          // Transform the data to match the expected format for our table
          const formattedBills = response.data.data.map(bill => ({
            id: bill._id || `bill-${Math.random().toString(36).substr(2, 9)}`,
            date: bill.date ? new Date(bill.date).toLocaleDateString() : 'N/A',
            customer: bill.customerId || 'Unknown Customer',
            driver: bill.driverId || 'Unknown Driver',
            source: bill.sourceLocation && bill.sourceLocation.address 
              ? bill.sourceLocation.address 
              : 'N/A',
            destination: bill.destinationLocation && bill.destinationLocation.address 
              ? bill.destinationLocation.address 
              : 'N/A',
            amount: bill.actualAmount || 0
          }));
          
          setBillingData(formattedBills);
        } else {
          console.log('No billing data found, using fallback data');
          // If no data or request not successful, show mock data
          setBillingData([
            {
              id: '1001',
              date: '05/01/2023',
              customer: 'John Doe',
              driver: 'Michael Driver',
              source: '123 Main St, San Francisco',
              destination: '456 Market St, San Francisco',
              amount: 25.50
            },
            {
              id: '1002',
              date: '05/02/2023',
              customer: 'Jane Smith',
              driver: 'Sarah Driver',
              source: '789 Howard St, San Francisco',
              destination: '101 Van Ness Ave, San Francisco',
              amount: 18.75
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching billing data:', error);
        setError('Failed to fetch billing data. Please try again later.');
        
        // Use mock data when API call fails
        setBillingData([
          {
            id: '1001',
            date: '05/01/2023',
            customer: 'John Doe',
            driver: 'Michael Driver',
            source: '123 Main St, San Francisco',
            destination: '456 Market St, San Francisco',
            amount: 25.50
          },
          {
            id: '1002',
            date: '05/02/2023',
            customer: 'Jane Smith',
            driver: 'Sarah Driver',
            source: '789 Howard St, San Francisco',
            destination: '101 Van Ness Ave, San Francisco',
            amount: 18.75
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBillingData();
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Add new handleRefreshIntervalChange function
  const handleRefreshIntervalChange = (interval) => {
    console.log(`Changing refresh interval to ${interval}ms`);
    setRefreshInterval(interval);
    setRealtimeUpdates(interval > 0);
  };

  // Add new handleManualRefresh function
  const handleManualRefresh = () => {
    console.log('Manual refresh triggered');
    fetchDashboardData();
  };

  const handleBillSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log('Searching for bills with term:', billSearchTerm);
      // If search term is empty, fetch all bills
      if (!billSearchTerm.trim()) {
        const response = await axios.get(`${API_BASE_URL}/admin/bills`);
        if (response.data && response.data.success) {
          const formattedBills = response.data.data.map(bill => ({
            id: bill._id || `bill-${Math.random().toString(36).substr(2, 9)}`,
            date: bill.date ? new Date(bill.date).toLocaleDateString() : 'N/A',
            customer: bill.customerId || 'Unknown Customer',
            driver: bill.driverId || 'Unknown Driver',
            source: bill.sourceLocation && bill.sourceLocation.address 
              ? bill.sourceLocation.address 
              : 'N/A',
            destination: bill.destinationLocation && bill.destinationLocation.address 
              ? bill.destinationLocation.address 
              : 'N/A',
            amount: bill.actualAmount || 0
          }));
          
          setBillingData(formattedBills);
        }
      } else {
        // Try to search on server
        const response = await axios.get(`${API_BASE_URL}/admin/bills`, {
          params: { search: billSearchTerm }
        });
        
        if (response.data && response.data.success && response.data.data.length > 0) {
          const formattedBills = response.data.data.map(bill => ({
            id: bill._id || `bill-${Math.random().toString(36).substr(2, 9)}`,
            date: bill.date ? new Date(bill.date).toLocaleDateString() : 'N/A',
            customer: bill.customerId || 'Unknown Customer',
            driver: bill.driverId || 'Unknown Driver',
            source: bill.sourceLocation && bill.sourceLocation.address 
              ? bill.sourceLocation.address 
              : 'N/A',
            destination: bill.destinationLocation && bill.destinationLocation.address 
              ? bill.destinationLocation.address 
              : 'N/A',
            amount: bill.actualAmount || 0
          }));
          
          setBillingData(formattedBills);
        } else {
          // If no results from server, use client-side filtering
          const filteredBills = billingData.filter(bill => 
            bill.id.toLowerCase().includes(billSearchTerm.toLowerCase()) ||
            bill.customer.toLowerCase().includes(billSearchTerm.toLowerCase()) ||
            bill.driver.toLowerCase().includes(billSearchTerm.toLowerCase())
          );
          
          setBillingData(filteredBills.length > 0 ? filteredBills : [
            {
              id: '1003',
              date: '05/03/2023',
              customer: 'Search Result',
              driver: 'Driver Example',
              source: '123 Example St',
              destination: '456 Sample Ave',
              amount: 15.00
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error searching bills:', error);
      setError('Failed to search bills. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = async (bill) => {
    try {
      // Fetch the complete bill details from the server
      console.log(`Fetching details for bill ${bill.id}...`);
      
      const response = await axios.get(`${API_BASE_URL}/admin/bills/${bill.id}`);
      
      if (response.data && response.data.success) {
        const fullBillData = response.data.data;
        console.log('Full bill data:', fullBillData);
        
        // Combine data from the list view with the detailed data
        setSelectedBill({
          ...bill,
          rideId: fullBillData.rideId,
          predictedAmount: fullBillData.predictedAmount,
          distanceCovered: fullBillData.distanceCovered,
          paymentStatus: fullBillData.paymentStatus,
          pickupTime: fullBillData.pickupTime,
          dropoffTime: fullBillData.dropoffTime,
          // Include any other fields from the detailed data
          sourceLocation: fullBillData.sourceLocation,
          destinationLocation: fullBillData.destinationLocation,
          // Keep the formatted display values
          source: bill.source,
          destination: bill.destination
        });
      } else {
        // If api call fails, just use the data we have
        setSelectedBill(bill);
      }
    } catch (error) {
      console.error(`Error fetching bill details for ${bill.id}:`, error);
      // If there's an error, just use the data we have from the list
      setSelectedBill(bill);
    }
  };

  const renderOverviewTab = () => (
    <div className="admin-overview-container">
      <div className="refresh-controls">
        <span className="last-updated">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </span>
        <select 
          value={refreshInterval} 
          onChange={(e) => handleRefreshIntervalChange(Number(e.target.value))}
          className="refresh-select"
        >
          <option value={0}>Manual refresh</option>
          <option value={10000}>Refresh every 10s</option>
          <option value={30000}>Refresh every 30s</option>
          <option value={60000}>Refresh every 1m</option>
        </select>
        <button onClick={handleManualRefresh} className="refresh-button">
          Refresh Now
        </button>
      </div>

      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <h3>Total Rides</h3>
          <p className="stat-value">{statistics.rideCount || 0}</p>
        </div>
        <div className="admin-stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">${(statistics.totalRevenue || 0).toFixed(2)}</p>
        </div>
        <div className="admin-stat-card">
          <h3>Active Drivers</h3>
          <p className="stat-value">{statistics.driverCount || 0}</p>
          <p className="stat-secondary">of {statistics.driverCount || 0}</p>
        </div>
        <div className="admin-stat-card">
          <h3>Active Customers</h3>
          <p className="stat-value">{statistics.customerCount || 0}</p>
          <p className="stat-secondary">of {statistics.customerCount || 0}</p>
        </div>
      </div>

      <div className="time-range-selector">
        <button 
          className={timeRange === 'daily' ? 'active' : ''} 
          onClick={() => handleTimeRangeChange('daily')}
        >
          Daily
        </button>
        <button 
          className={timeRange === 'weekly' ? 'active' : ''} 
          onClick={() => handleTimeRangeChange('weekly')}
        >
          Weekly
        </button>
        <button 
          className={timeRange === 'monthly' ? 'active' : ''} 
          onClick={() => handleTimeRangeChange('monthly')}
        >
          Monthly
        </button>
      </div>

      <div className="admin-charts-row">
        <div className="admin-chart-container">
          <h3>Rides by City/Region</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ridesByCity}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="city"
                label={({ city, count }) => `${city}: ${count}`}
              >
                {ridesByCity.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-container">
          <h3>Peak Usage Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={ridesByHour}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Number of Rides" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-chart-container large-chart">
        <h3>Revenue by Day of Week</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={revenueByDay}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="#1976d2" 
              activeDot={{ r: 8 }} 
              name="Daily Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderBillingTab = () => (
    <div className="admin-billing-container">
      {selectedBill ? (
        <div className="bill-details">
          <h3>Bill Details</h3>
          <div className="bill-info">
            <div className="info-section">
              <h4>Bill Information</h4>
              <div className="info-row">
                <span className="info-label">Bill ID:</span>
                <span className="info-value">{selectedBill.id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Date:</span>
                <span className="info-value">{selectedBill.date}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Ride ID:</span>
                <span className="info-value">{selectedBill.rideId || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Amount:</span>
                <span className="info-value">${selectedBill.amount.toFixed(2)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Predicted Amount:</span>
                <span className="info-value">${selectedBill.predictedAmount ? selectedBill.predictedAmount.toFixed(2) : 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Distance:</span>
                <span className="info-value">{selectedBill.distanceCovered ? `${selectedBill.distanceCovered.toFixed(1)} miles` : 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Payment Status:</span>
                <span className="info-value">{selectedBill.paymentStatus || 'Paid'}</span>
              </div>
            </div>
            
            <div className="info-section">
              <h4>Ride Details</h4>
              <div className="info-row">
                <span className="info-label">Customer:</span>
                <span className="info-value">{selectedBill.customer}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Driver:</span>
                <span className="info-value">{selectedBill.driver}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Source:</span>
                <span className="info-value">{selectedBill.source}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Destination:</span>
                <span className="info-value">{selectedBill.destination}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Pickup Time:</span>
                <span className="info-value">{selectedBill.pickupTime ? new Date(selectedBill.pickupTime).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Dropoff Time:</span>
                <span className="info-value">{selectedBill.dropoffTime ? new Date(selectedBill.dropoffTime).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div className="bill-actions">
            <button onClick={() => setSelectedBill(null)}>Back to Billing List</button>
            <button className="print-button">Print Bill</button>
          </div>
        </div>
      ) : (
        <>
          <div className="admin-section-header">
            <h2>Billing Management</h2>
          </div>
          
          <div className="search-bar">
            <form onSubmit={handleBillSearch}>
              <input
                type="text"
                placeholder="Search by bill ID, customer or driver..."
                value={billSearchTerm}
                onChange={(e) => setBillSearchTerm(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Driver</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {billingData.map(bill => (
                  <tr key={bill.id}>
                    <td>{bill.id}</td>
                    <td>{bill.date}</td>
                    <td>{bill.customer}</td>
                    <td>{bill.driver}</td>
                    <td>{bill.source}</td>
                    <td>{bill.destination}</td>
                    <td>${bill.amount.toFixed(2)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="view-button"
                          onClick={() => handleViewBill(bill)}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-header">
        <div className="admin-dashboard-logo">UBER</div>
        <h1 className="admin-dashboard-title">Admin Dashboard</h1>
      </div>
      
      <div className="admin-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'drivers' ? 'active' : ''} 
          onClick={() => handleTabChange('drivers')}
        >
          Drivers
        </button>
        <button 
          className={activeTab === 'customers' ? 'active' : ''} 
          onClick={() => handleTabChange('customers')}
        >
          Customers
        </button>
        <button 
          className={activeTab === 'billing' ? 'active' : ''} 
          onClick={() => handleTabChange('billing')}
        >
          Billing
        </button>
        <button 
          className={activeTab === 'rides' ? 'active' : ''} 
          onClick={() => handleTabChange('rides')}
        >
          Rides
        </button>
      </div>
      
      <div className="admin-dashboard-content">
        {loading ? (
          <div className="loading-indicator">Loading data...</div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : null}
        
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'drivers' && <AdminDriverManagement />}
        {activeTab === 'customers' && <AdminCustomerManagement />}
        {activeTab === 'billing' && renderBillingTab()}
        {activeTab === 'rides' && <AdminRideManagement />}
      </div>
      
      <div className="admin-dashboard-footer">
        <button className="admin-logout-button" onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('role');
          navigate('/');
        }}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
