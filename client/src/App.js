import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/UI/HomePage/HomePage';
import LoginCustomer from './components/Customer/LoginCustomer/LoginCustomer';
import LoginDriver from './components/Driver/LoginDriver/LoginDriver';
import RegisterCustomer from "./components/Customer/RegisterCustomer/RegisterCustomer";
import RegisterDriver from "./components/Driver/RegisterDriver/RegisterDriver";
import CustomerDashboard from './components/Customer/CustomerDashboard/CustomerDashboard';
import CustomerProfilePage from './components/Customer/CustomerProfilePage/CustomerProfilePage';
import DriverDashboard from './components/Driver/DriverDashboard/DriverDashboard';
import DriverManageRides from "./components/Driver/DriverManageRides/DriverManageRides";
import DriverEarnings from "./components/Driver/DriverEarnings/DriverEarnings";
import CustomerBillingList from './components/Customer/CustomerBillingList/CustomerBillingList';
import CustomerRequestRide from './components/Customer/CustomerRequestRide/CustomerRequestRide';
import CustomerRideHistory from './components/Customer/CustomerRideHistory/CustomerRideHistory';
import Wallet from './components/Customer/Wallet/Wallet';
import LoginAdmin from './components/Admin/LoginAdmin/LoginAdmin';
import AdminDashboard from './components/Admin/AdminDashboard/AdminDashboard';
import MainLayout from './components/UI/Layout/MainLayout';
import './App.css';

import { getAccessToken } from './utils/getAccessToken';
import { extractClaims } from './utils/extractClaims';

function App() {
  const [sub, setSub] = useState(null);
  const [roles, setRoles] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const claims = extractClaims(token);
      if (claims) {
        setSub(claims.sub);
        setRoles(claims.roles);
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Handle location error (e.g., user denied permission)
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      // Handle case where geolocation is not supported
    }
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
        <Route element={<MainLayout />}>
          <Route path="/customer/dashboard" element={<CustomerDashboard userId={sub} latitude={latitude} longitude={longitude} />} />
          <Route path="/customer/profile" element={<CustomerProfilePage userId={sub} />} />
          <Route path="/customer/request-ride" element={<CustomerRequestRide userId={sub} latitude={latitude} longitude={longitude} />} />
          <Route path="/customer/billing-history" element={<CustomerBillingList userId={sub} />} />
          <Route path="/customer/ride-history" element={<CustomerRideHistory userId={sub} />} />
          <Route path="/customer/wallet" element={<Wallet userId={sub} />} />
        </Route>

          <Route path="/" element={<HomePage />} />
          <Route path="/login-customer" element={<LoginCustomer />} />
          <Route path="/login-driver" element={<LoginDriver />} />
          <Route path="/register-customer" element={<RegisterCustomer />} />
          <Route path="/register-driver" element={<RegisterDriver />} />
          
          <Route path="/driver/dashboard" element={<DriverDashboard userId={sub} latitude={latitude} longitude={longitude} />} />
          <Route path="/driver/earnings" element={<DriverEarnings userId={sub} />} />
          <Route path="/driver/manage-rides" element={<DriverManageRides userId={sub} />} />
          
          <Route path="/login-admin" element={<LoginAdmin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard userId={sub} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
