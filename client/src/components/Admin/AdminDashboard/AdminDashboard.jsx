import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import AdminDriverManagement from './AdminDriverManagement';
import AdminCustomerManagement from './AdminCustomerManagement';
import AdminRideManagement from './AdminRideManagement';

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
  const [socket, setSocket] = useState(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState(true);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Initialize Socket.io connection
  useEffect(() => {
    // Connect to admin service WebSocket
    const newSocket = io(process.env.REACT_APP_ADMIN_SERVICE_URL || 'http://localhost:8001');
    
    newSocket.on('connect', () => {
      console.log('Connected to admin service socket');
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Real-time updates are currently unavailable');
    });
    
    setSocket(newSocket);
    
    // Clean up socket connection on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Set up real-time data update listeners
  useEffect(() => {
    if (!socket || !realtimeUpdates) return;
    
    // Listen for overview stats updates
    socket.on('dashboard-update:overview', (data) => {
      console.log('Received overview update:', data);
      setStatistics(data);
    });
    
    // Listen for rides stats updates
    socket.on('dashboard-update:rides', (data) => {
      console.log('Received rides update:', data);
      if (data.ridesByCity) setRidesByCity(data.ridesByCity);
      if (data.ridesByHour) setRidesByHour(data.ridesByHour);
    });
    
    // Listen for billing updates
    socket.on('dashboard-update:billing', (data) => {
      console.log('Received billing update:', data);
      if (data.billingData) setBillingData(prev => {
        // Merge and deduplicate billing data
        const newData = [...prev];
        data.billingData.forEach(bill => {
          const existingIndex = newData.findIndex(b => b.id === bill.id);
          if (existingIndex >= 0) {
            newData[existingIndex] = bill;
          } else {
            newData.unshift(bill);
          }
        });
        return newData;
      });
    });
    
    return () => {
      // Remove event listeners when component unmounts or deps change
      socket.off('dashboard-update:overview');
      socket.off('dashboard-update:rides');
      socket.off('dashboard-update:billing');
    };
  }, [socket, realtimeUpdates]);

  // Fetch dashboard data from APIs
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (activeTab !== 'overview') return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch overview statistics
        const statsResponse = await axios.get('/api/v1/admin/statistics/overview');
        if (statsResponse.data) {
          setStatistics(statsResponse.data);
        }
        
        // Fetch rides by city data
        const cityResponse = await axios.get(`/api/v1/admin/statistics/rides-by-city?timeRange=${timeRange}`);
        if (cityResponse.data) {
          setRidesByCity(cityResponse.data);
        }
        
        // Fetch rides by hour data
        const hourResponse = await axios.get(`/api/v1/admin/statistics/rides-by-hour?timeRange=${timeRange}`);
        if (hourResponse.data) {
          setRidesByHour(hourResponse.data);
        }
        
        // Fetch revenue by day data
        const revenueResponse = await axios.get(`/api/v1/admin/statistics/revenue-by-day?timeRange=${timeRange}`);
        if (revenueResponse.data) {
          setRevenueByDay(revenueResponse.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange, activeTab]);

  // Fetch billing data 
  useEffect(() => {
    const fetchBillingData = async () => {
      if (activeTab !== 'billing') return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get('/api/v1/admin/bills', {
          params: { page: 1, limit: 10 }
        });
        
        if (response.data && response.data.data) {
          setBillingData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching billing data:', error);
        setError('Failed to fetch billing data. Please try again later.');
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

  const handleBillSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.get('/api/v1/admin/bills', {
        params: { search: billSearchTerm }
      });
      
      if (response.data && response.data.data) {
        setBillingData(response.data.data);
      }
    } catch (error) {
      console.error('Error searching bills:', error);
      setError('Failed to search bills. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
  };

  const toggleRealtimeUpdates = () => {
    setRealtimeUpdates(!realtimeUpdates);
  };

  const renderOverviewTab = () => (
    <div className="admin-overview-container">
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <h3>Total Rides</h3>
          <p className="stat-value">{statistics.totalRides}</p>
        </div>
        <div className="admin-stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">${statistics.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="admin-stat-card">
          <h3>Active Drivers</h3>
          <p className="stat-value">{statistics.activeDrivers}</p>
          <p className="stat-secondary">of {statistics.totalDrivers}</p>
        </div>
        <div className="admin-stat-card">
          <h3>Active Customers</h3>
          <p className="stat-value">{statistics.activeCustomers}</p>
          <p className="stat-secondary">of {statistics.totalCustomers}</p>
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
                dataKey="value"
                nameKey="city"
                label={({ city, value }) => `${city}: ${value}`}
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
              <Bar dataKey="rides" fill="#8884d8" name="Number of Rides" />
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
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
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
                <span className="info-label">Amount:</span>
                <span className="info-value">${selectedBill.amount.toFixed(2)}</span>
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
        <div className="realtime-toggle">
          <label>
            <input 
              type="checkbox" 
              checked={realtimeUpdates} 
              onChange={toggleRealtimeUpdates} 
            />
            Real-time updates
          </label>
        </div>
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
