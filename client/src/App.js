import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import LoginCustomer from './components/LoginCustomer/LoginCustomer';
import LoginDriver from './components/LoginDriver/LoginDriver';
import CustomerDashboard from './components/CustomerDashboard/CustomerDashboard';
import DriverDashboard from './components/DriverDashboard/DriverDashboard';
import CustomerBillingList from './components/CustomerBillingList/CustomerBillingList';
import CustomerRequestRide from './components/CustomerRequestRide/CustomerRequestRide';
import CustomerRideHistory from './components/CustomerRideHistory/CustomerRideHistory';
import Wallet from './components/Wallet/Wallet';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login-customer" element={<LoginCustomer />} />
          <Route path="/login-driver" element={<LoginDriver />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/customer/billing-history" element={<CustomerBillingList />} />
          <Route path="/customer/request-ride" element={<CustomerRequestRide />} />
          <Route path="/customer/ride-history" element={<CustomerRideHistory />} />
          <Route path="/customer/wallet" element={<Wallet />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
