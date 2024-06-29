import React from "react";
import { Link } from "react-router-dom"; // Assuming you use React Router for navigation
import logo from "../assets/logo.png";

const Header = () => {
  return (
    <div style={{ textAlign: "center", fontSize: "30px", fontFamily: "n", backgroundColor: "#b7c9db", padding: "10px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px" }}>
        <div>
          <img src={logo} alt="Logo" style={{ width: 150 }} />
        </div>
        <div>
          <nav style={{ display: "flex", alignItems: "center" }}>
            <Link to="/" style={{ margin: "0 10px", color: "black", textDecoration: "none" }}>Home</Link>
            <Link to="/products" style={{ margin: "0 10px", color: "black", textDecoration: "none" }}>Products</Link>
            <Link to="/about" style={{ margin: "0 10px", color: "black", textDecoration: "none" }}>About Us</Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Header;
