import React from 'react';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'drivers', label: 'Drivers' },
  { key: 'customers', label: 'Customers' },
  { key: 'billing', label: 'Billing' },
  { key: 'rides', label: 'Rides' },
];

const AdminNavigationTabs = ({ activeTab, onTabChange }) => {
  return (
    <div className="admin-tabs">
      {TABS.map(tab => (
        <button 
          key={tab.key}
          className={activeTab === tab.key ? 'active' : ''} 
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default AdminNavigationTabs;