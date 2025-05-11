import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import LoginCustomer from './components/LoginCustomer/LoginCustomer';
import LoginDriver from './components/LoginDriver/LoginDriver';
import RegisterCustomer from "./components/RegisterCustomer/RegisterCustomer";
import RegisterDriver from "./components/RegisterDriver/RegisterDriver";
import CustomerDashboard from './components/CustomerDashboard/CustomerDashboard';
import DriverDashboard from './components/DriverDashboard/DriverDashboard';
import DriverManageRides from "./components/DriverManageRides/DriverManageRides";
import DriverEarnings from "./components/DriverEarnings/DriverEarnings";
import CustomerBillingList from './components/CustomerBillingList/CustomerBillingList';
import CustomerRequestRide from './components/CustomerRequestRide/CustomerRequestRide';
import CustomerRideHistory from './components/CustomerRideHistory/CustomerRideHistory';
import Wallet from './components/Wallet/Wallet';
import LoginAdmin from './components/LoginAdmin/LoginAdmin';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import MainLayout from './components/Layout/MainLayout';
import './App.css';


import { getAccessToken } from './utils/getAccessToken';
import { extractClaims } from './utils/extractClaims';
const accessToken = getAccessToken();
const userId = null; 
let sub = null;      
let roles = null;    

if (accessToken) {
  const extractedClaims = extractClaims(accessToken); // Call extractClaims and store the result.
    if (extractedClaims) {
    ({ sub, roles } = extractedClaims);
  }
}



function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
        <Route element={<MainLayout />}>
          <Route path="/customer/dashboard" element={<CustomerDashboard userId={sub} />} />
        </Route>
          <Route path="/" element={<HomePage />} />
          <Route path="/login-customer" element={<LoginCustomer />} />
          <Route path="/login-driver" element={<LoginDriver />} />
          <Route path="/register-customer" element={<RegisterCustomer />} />
          <Route path="/register-driver" element={<RegisterDriver />} />
          
          <Route path="/driver/dashboard" element={<DriverDashboard userId={sub} />} />
          <Route path="/driver/earnings" element={<DriverEarnings userId={sub} />} />
          <Route path="/driver/manage-rides" element={<DriverManageRides userId={sub} />} />
          <Route path="/customer/billing-history" element={<CustomerBillingList userId={sub} />} />
          <Route path="/customer/request-ride" element={<CustomerRequestRide userId={sub} />} />
          <Route path="/customer/ride-history" element={<CustomerRideHistory userId={sub} />} />
          <Route path="/customer/wallet" element={<Wallet userId={sub} />} />
          <Route path="/login-admin" element={<LoginAdmin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard userId={sub} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
