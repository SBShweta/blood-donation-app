// src/components/Layout.js
import React from "react";
import { Link } from "react-router-dom";

const Layout = ({ children }) => {
  return (
    <>
      <nav style={{ padding: "1rem", background: "#f8f9fa" }}>
        <Link to="/" style={{ marginRight: "1rem" }}>Home</Link>
        <Link to="/login" style={{ marginRight: "1rem" }}>Login</Link>
        <Link to="/register">Register</Link>
      </nav>
      <main>{children}</main>
    </>
  );
};

export default Layout;
