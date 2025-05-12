import React from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { COLORS } from '../../../../utils/adminDashboardUtils'; // Assuming COLORS is still in utils

const OverviewTabContent = ({
  statistics,
  ridesByCity,
  ridesByHour,
  revenueByDay,
  timeRange,
  onTimeRangeChange,
  loading, // Pass loading state specific to overview data if needed
  error    // Pass error state specific to overview data if needed
}) => {
  if (loading) return <div className="loading-indicator">Loading overview data...</div>;
  if (error) return <div className="error-message"><p>{error}</p></div>;

  return (
    <div className="admin-overview-container">
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <h3>Total Rides</h3>
          <p className="stat-value">{statistics.totalRides}</p>
        </div>
        <div className="admin-stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">${(statistics.totalRevenue || 0).toFixed(2)}</p>
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
          onClick={() => onTimeRangeChange('daily')}
        >
          Daily
        </button>
        <button 
          className={timeRange === 'weekly' ? 'active' : ''} 
          onClick={() => onTimeRangeChange('weekly')}
        >
          Weekly
        </button>
        <button 
          className={timeRange === 'monthly' ? 'active' : ''} 
          onClick={() => onTimeRangeChange('monthly')}
        >
          Monthly
        </button>
      </div>

      <div className="admin-charts-row">
        <div className="admin-chart-container">
          <h3>Rides by City/Region</h3>
          {ridesByCity.length > 0 ? (
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
                  label={({ city, percent, value }) => `${city}: ${value} (${(percent * 100).toFixed(0)}%)`}
                >
                  {ridesByCity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No ride data available to display by city/region.</p>
          )}
        </div>

        <div className="admin-chart-container">
          <h3>Peak Usage Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ridesByHour} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          <LineChart data={revenueByDay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#1976d2" activeDot={{ r: 8 }} name="Daily Revenue" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OverviewTabContent;