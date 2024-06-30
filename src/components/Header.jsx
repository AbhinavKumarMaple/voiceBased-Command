import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "../components/Header.css"; // Import your CSS stylesheet

const Header = () => {
  return (
    <div className="header-container">
      <div className="header-content">
       
      
        
        <nav className="nav-links">
        <img src={logo} alt="Logo" className="logo" />
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/products" className="nav-link">Products</Link>
          <Link to="/image-query" className="nav-link">Invoice AI</Link>
          <Link to="/about" className="nav-link">About Us</Link>
          
        </nav>
      </div>
    </div>
  );
};

export default Header;
