import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '../../../../utils/adminDashboardUtils'; // Assuming colors are defined here

const StateRidesChart = ({ data, isLoading, error }) => {
  if (isLoading) {
    return <div className="loading-indicator">Loading chart data...</div>;
  }

  if (error) {
    return <div className="error-message">Error loading chart data: {error}</div>;
  }

  if (!data || data.length === 0) {
    return <p>No data available to display rides by state.</p>;
  }

  return (
    <div className="admin-chart-container">
      <h3>Rides per State</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 70, // Increased bottom margin for rotated labels
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name" // 'name' property will hold the state name
            angle={-45} // Rotate labels for better readability
            textAnchor="end" // Anchor rotated labels correctly
            interval={0} // Show all labels
            height={80} // Adjust height to accommodate rotated labels
          />
          <YAxis allowDecimals={false} /> {/* Ride counts are whole numbers */}
          <Tooltip />
          <Legend />
          <Bar dataKey="count" name="Number of Rides" fill={CHART_COLORS[0] || "#8884d8"} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StateRidesChart;