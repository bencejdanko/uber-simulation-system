import React from 'react';

const BillingTabContent = ({
  billingData,
  selectedBill,
  billSearchTerm,
  onBillSearchTermChange,
  onBillSearchSubmit,
  onViewBill,
  onClearSelectedBill,
  loading, // Pass loading state specific to billing data if needed
  error    // Pass error state specific to billing data if needed
}) => {
  if (loading) return <div className="loading-indicator">Loading billing data...</div>;
  if (error) return <div className="error-message"><p>{error}</p></div>;

  return (
    <div className="admin-billing-container">
      {selectedBill ? (
        <div className="bill-details">
          <h3>Bill Details</h3>
          <div className="bill-info">
            <div className="info-section">
              <h4>Bill Information</h4>
              <div className="info-row">
                <span className="info-label">Bill ID:</span>
                <span className="info-value">{selectedBill.id || selectedBill._id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Date:</span>
                <span className="info-value">{new Date(selectedBill.billDate || selectedBill.date).toLocaleDateString()}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Amount:</span>
                <span className="info-value">${(selectedBill.amount || 0).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="info-section">
              <h4>Ride Details</h4>
              <div className="info-row">
                <span className="info-label">Customer:</span>
                <span className="info-value">{selectedBill.customerName || selectedBill.customer?.firstName || selectedBill.customer}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Driver:</span>
                <span className="info-value">{selectedBill.driverName || selectedBill.driver?.firstName || selectedBill.driver}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Source:</span>
                <span className="info-value">{selectedBill.pickupAddress || selectedBill.source}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Destination:</span>
                <span className="info-value">{selectedBill.dropoffAddress || selectedBill.destination}</span>
              </div>
            </div>
          </div>
          
          <div className="bill-actions">
            <button onClick={onClearSelectedBill}>Back to Billing List</button>
            {/* <button className="print-button">Print Bill</button> */}
          </div>
        </div>
      ) : (
        <>
          <div className="admin-section-header">
            <h2>Billing Management</h2>
          </div>
          
          <div className="search-bar">
            <form onSubmit={onBillSearchSubmit}>
              <input
                type="text"
                placeholder="Search by bill ID, customer or driver..."
                value={billSearchTerm}
                onChange={(e) => onBillSearchTermChange(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill ID</th><th>Date</th><th>Customer</th><th>Driver</th>
                  <th>Source</th><th>Destination</th><th>Amount</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {billingData.map(bill => (
                  <tr key={bill.id || bill._id}>
                    <td>{bill.id || bill._id}</td>
                    <td>{new Date(bill.billDate || bill.date).toLocaleDateString()}</td>
                    <td>{bill.customerName || bill.customer?.firstName || bill.customer}</td>
                    <td>{bill.driverName || bill.driver?.firstName || bill.driver}</td>
                    <td>{bill.pickupAddress || bill.source}</td>
                    <td>{bill.dropoffAddress || bill.destination}</td>
                    <td>${(bill.amount || 0).toFixed(2)}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="view-button" onClick={() => onViewBill(bill)}>
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
};

export default BillingTabContent;