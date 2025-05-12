import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DriverEarnings.css';
import { useGetBillsByDriverQuery } from '../../../api/apiSlice';

const DriverEarnings = ({ userId }) => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('');
  const [billingRecords, setBillingRecords] = useState([]);

  // Fetch billing records for the driver
  const { data: billsData, isLoading, error } = useGetBillsByDriverQuery(userId);

  useEffect(() => {
    if (billsData) {
      const formattedRecords = billsData.map((bill) => ({
        id: bill.billingId,
        rideId: bill.rideId,
        date: new Date(bill.date).toLocaleDateString(),
        amount: bill.actualAmount !== undefined ? `$${bill.actualAmount.toFixed(2)}` : 'N/A',
        paymentStatus: bill.paymentStatus,
        // Add more fields if needed for display
      }));
      setBillingRecords(formattedRecords);
    }
  }, [billsData]);

  const handleDownloadReceipt = (billingId) => {
    console.log(`Downloading receipt for billing ID: ${billingId}`);
    // Logic to download the receipt can be added here
  };

  const filteredBillingRecords = billingRecords.filter(
    (record) =>
      !filterStatus || record.paymentStatus.toLowerCase() === filterStatus.toLowerCase()
  );

  return (
    <div className="driver-manage-billing-container">
      <header className="billing-header">
        <div className="billing-logo">Uber</div>
        <div className="billing-title">Driver Manage Billing</div>
      </header>

      <div className="billing-section">
        <h2 className="section-title">Billing Records</h2>

        <div className="filter-section">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="VOID">Void</option>
          </select>
        </div>

        {isLoading && <p>Loading billing records...</p>}
        {error && <p className="error-message">Error loading billing records: {error.message || 'Unknown error'}</p>}

        <table className="billing-table">
          <thead>
            <tr>
              <th>Billing ID</th>
              <th>Ride ID</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Payment Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBillingRecords.length === 0 && !isLoading && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>No billing records found.</td>
              </tr>
            )}
            {filteredBillingRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.rideId}</td>
                <td>{record.date}</td>
                <td>{record.amount}</td>
                <td>
                  <span className={`status ${record.paymentStatus.toLowerCase()}`}>
                    {record.paymentStatus}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleDownloadReceipt(record.id)}
                    className="download-button"
                  >
                    Download Receipt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="navigation-buttons">
        <button className="nav-button" onClick={() => navigate('/')}>
          Homepage
        </button>
        <button className="nav-button" onClick={() => navigate('/driver/dashboard')}>
          Driver Dashboard
        </button>
        <button className="nav-button" onClick={() => navigate('/driver/manage-rides')}>
          Manage Rides
        </button>
      </div>
    </div>
  );
};

export default DriverEarnings;