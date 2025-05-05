import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  const handleCustomerLogin = () => {
    navigate('/login-customer');
  };

  const handleDriverLogin = () => {
    navigate('/login-driver');
  };

  const handleAdminLogin = () => {
    navigate('/login-admin');
  };

  const handleRegisterRider = () => {
    navigate('/register-customer');
  };

  const handleRegisterDriver = () => {
    navigate('/register-driver');
  };


  return (
    <div className="home-container sidebar-layout">
      <aside className="sidebar">
        <div className="sidebar-title">Login</div>
        <button className="sidebar-button" onClick={handleCustomerLogin}>
          Customer Login
        </button>
        <button className="sidebar-button" onClick={handleDriverLogin}>
          Driver Login
        </button>
        <button className="sidebar-button" onClick={handleAdminLogin}>
          Admin Login
        </button>
      </aside>

      <main className="main-content">
        <section className="home-section section-one">
          <div className="section-image-container image-left">
            <img src="img/rider.webp" alt="Feature 1" className="section-image" />
          </div>
          <div className="section-text-container text-right">
            <h2 className="section-header">Request a Ride Anywhere</h2>
            <p className="section-paragraph">
              Get where you need to go quickly and reliably. Our vast network of drivers is ready to pick you up in minutes. Track your ride in real-time.
            </p>
            <button className="section-button" onClick={handleRegisterRider}>
              Register as Rider
            </button>
          </div>
        </section>

        <section className="home-section section-two">
          <div className="section-text-container text-left">
            <h2 className="section-header">Drive and Earn on Your Schedule</h2>
            <p className="section-paragraph">
              Be your own boss and make money driving with Uber. Set your own hours, choose your rides, and get paid weekly. Sign up today to start earning.
            </p>
            <button className="section-button" onClick={handleRegisterDriver}>
              Register as Driver
            </button>
          </div>
          <div className="section-image-container image-right">
            <img src="img/driver.webp" alt="Feature 2" className="section-image" />
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;