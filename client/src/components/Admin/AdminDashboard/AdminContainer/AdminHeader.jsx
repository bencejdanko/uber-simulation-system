import React from 'react';

const AdminHeader = ({ realtimeUpdates, toggleRealtimeUpdates }) => {
  return (
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
  );
};

export default AdminHeader;