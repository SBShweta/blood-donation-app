import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DonorDashboard from "./pages/DonorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RecipientDashboard from "./pages/RecipientDashboard";
import Navbar from "./components/Navbar"; 
import Logout from "./pages/Logout";
import RequestBlood from "./pages/RequestBlood";
import DonateBlood from './pages/DonateBlood';




function App() {
  return (
    <Router>
      
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard/>} />
        <Route path="/recipient-dashboard" element={<RecipientDashboard/>} />
        <Route path="/request-blood" element={<RequestBlood/>} />
        <Route path="/donate-blood" element={<DonateBlood />} />
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </Router>
  );
}

export default App;
