//i am replacing axios to api 

import React, { useState, useEffect } from 'react';
//import axios from 'axios';
import api from "../utils/api";

import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [error, setError] = useState('');

  // Helper function to get authorization header
  const getAuthHeader = () => {
    const token = localStorage.getItem('userToken');
    console.log('Token:', token);  // Log the token for debugging
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get(
         // 'http://localhost:5000/api/users',
         '/api/users',
          getAuthHeader()
        );
        setUsers(response.data);
      } catch (err) {
        setError('Failed to fetch users.');
        console.error('Users fetch error:', err.response?.data || err.message);
      }
    };

    const fetchBloodRequests = async () => {
      try {
        const response = await api.get(
         // 'http://localhost:5000/api/blood-requests',
         '/api/blood-requests',
          getAuthHeader()
        );
        setBloodRequests(response.data);
      } catch (err) {
        setError('Failed to fetch blood requests.');
        console.error('Requests fetch error:', err.response?.data || err.message);
      }
    };

    fetchUsers();
    fetchBloodRequests();
  }, []);

  const handleApproveRequest = async (requestId) => {
    try {
      await api.put(
        //`http://localhost:5000/api/blood-requests/approve/${requestId}`,
        `/api/blood-requests/approve/${requestId}`,
        {},
        getAuthHeader()
      );
      alert('Blood request approved!');
      setBloodRequests(bloodRequests.filter((req) => req._id !== requestId));
    } catch (err) {
      alert('Failed to approve the request.');
      console.error('Approve error:', err.response?.data || err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(
         `/api/users/${userId}`,
        //`http://localhost:5000/api/users/${userId}`,
        getAuthHeader()
      );
      alert('User deleted successfully!');
      setUsers(users.filter((user) => user._id !== userId));
    } catch (err) {
      alert('Failed to delete the user.');
      console.error('Delete error:', err.response?.data || err.message);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h2>Admin Dashboard</h2>
        <Link to="/logout" className="btn btn-outline-danger">Logout</Link>
      </div>
      {error && <div className="alert alert-danger mt-2">{error}</div>}

      <h3 className="mt-4">Users List</h3>
      <div className="row">
        {users.length === 0 ? (
          <p>No users available.</p>
        ) : (
          users.map((user) => (
            <div className="col-md-4 mb-3" key={user._id}>
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{user.name}</h5>
                  <p>{user.email}</p>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteUser(user._id)}
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <h3 className="mt-4">Pending Blood Requests</h3>
      <div className="row">
        {bloodRequests.length === 0 ? (
          <p>No pending blood requests.</p>
        ) : (
          bloodRequests.map((request) => (
            <div className="col-md-4 mb-3" key={request._id}>
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{request.bloodType}</h5>
                  <p>Requested by: {request.requesterName}</p>
                  <p>Hospital: {request.hospital}</p>
                  <button
                    className="btn btn-success"
                    onClick={() => handleApproveRequest(request._id)}
                  >
                    Approve Request
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
