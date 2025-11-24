import React, { useState } from 'react';
//import axios from 'axios';
import api from "../utils/api";

import { useNavigate } from 'react-router-dom';

//const API_URL = process.env.REACT_APP_API_URL || '/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const response = await api.post(`/auth/login`, { email, password });
      const { token, user } = response.data;

      // Save token & user info to localStorage
      localStorage.setItem('userToken', token); // Store token
      localStorage.setItem('userInfo', JSON.stringify(user)); // Store user info
      localStorage.setItem('userRole', user.role); // Store user role

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (user.role === 'donor') {
        navigate('/donor-dashboard');
      } else if (user.role === 'recipient') {
        navigate('/recipient-dashboard');
      } else {
        navigate('/dashboard'); // fallback
      }

    } catch (err) {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Login</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
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
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
    </div>
  );
};

export default Login;
