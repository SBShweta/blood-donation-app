import React, { useState } from 'react';
//import axios from 'axios';
import api from "../utils/api";

import { useNavigate } from 'react-router-dom';

//const API_URL = process.env.REACT_APP_API_URL || '/api'; 

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState('donor');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      //await axios.post('http://localhost:5000/api/auth/register', 
     await api.post(`/auth/register`, {
        name,
        email,
        password,
        bloodType,
        age,
        gender,
        location,
        role,
      });
      navigate('/login');
    } catch (err) {
      // Check if a specific error message is returned from the backend (e.g., user exists)
      const message = err.response && err.response.data && err.response.data.error
        ? err.response.data.error
        : 'Registration failed. Please try again.';
      setError(message);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Register</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Blood Type</label>
          <select
            className="form-select"
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value)}
            required
          >
            <option value="">Select Blood Type</option>
            <option value="A+">A+</option>
            <option value="B+">B+</option>
            <option value="O+">O+</option>
            <option value="AB+">AB+</option>
            <option value="A-">A-</option>
            <option value="B-">B-</option>
            <option value="O-">O-</option>
            <option value="AB-">AB-</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Age</label>
          <input
            type="number"
            className="form-control"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Gender</label>
          <select
            className="form-select"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Location</label>
          <input
            type="text"
            className="form-control"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Register As</label>
          <select
            className="form-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="donor">Donor</option>
            <option value="recipient">Recipient</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">Register</button>
      </form>
    </div>
  );
};

export default Register;
