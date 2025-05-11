import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar/Navbar'; // Adjust path if necessary
import './MainLayout.css'; // Styles for this layout

const MainLayout = () => {
  return (
    <div className="main-layout">
      <Navbar />
      <main className="main-content">
        <Outlet /> {/* Nested routes will render their components here */}
      </main>
      {/* You could also include a Footer component here if needed */}
    </div>
  );
};

export default MainLayout;