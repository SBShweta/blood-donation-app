import React, { useState, useEffect } from 'react';
import api from "../utils/api";
import { Link } from 'react-router-dom';

const DonorDashboard = () => {
  const [donations, setDonations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('🔄 Fetching donations...');
        
        // Check if user is authenticated
        const token = localStorage.getItem('userToken');
        if (!token) {
          setError('Please login again.');
          setLoading(false);
          return;
        }

        console.log('📞 Making API call to /donations/my-donations');
        const response = await api.get('/donations/my-donations');
        console.log('✅ API Response:', response);
        console.log('📊 Response data:', response.data);

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setDonations(response.data);
          console.log(`🎉 Loaded ${response.data.length} donations`);
        } else {
          setError('You have no donations recorded.');
          console.log('ℹ️ No donations found for user');
        }
      } catch (err) {
        console.error('❌ Error fetching donations:', err);
        console.error('Error details:', err.response);
        setError(err.response?.data?.message || 'Failed to fetch donation history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h2>Donor Dashboard</h2>
        <Link to="/logout" className="btn btn-outline-danger">Logout</Link>
      </div>

      <p className="mt-3">Welcome, Donor! You can donate blood below and view your donation history.</p>

      {/* Donate Blood Button */}
      <div className="mt-3">
        <Link to="/donate-blood" className="btn btn-success btn-lg">Donate Blood</Link>
      </div>

      {/* Debug Info - Remove after fixing */}
      <div className="mt-3 p-3 bg-light border rounded">
        <h6>Debug Information:</h6>
        <p>Donations in state: {donations.length}</p>
        <p>Loading: {loading.toString()}</p>
        <p>Error: {error || 'None'}</p>
      </div>

      {/* Displaying Donation History */}
      <div className="mt-5">
        <h4>Your Donation History</h4>
        
        {loading && (
          <div className="alert alert-info">
            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
            Loading donations...
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger mt-2">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {!loading && donations.length === 0 && !error && (
          <div className="alert alert-warning">
            You haven't donated blood yet. Click "Donate Blood" to make your first donation!
          </div>
        )}
        
        {donations.length > 0 && (
          <div className="row">
            {donations.map((donation, index) => (
              <div className="col-md-6 mb-3" key={donation._id || index}>
                <div className="card h-100 border-success">
                  <div className="card-header bg-success text-white">
                    <h5 className="card-title mb-0">Blood Donation</h5>
                  </div>
                  <div className="card-body">
                    <p className="card-text"><strong>Blood Type:</strong> {donation.bloodType}</p>
                    <p className="card-text"><strong>Donor Name:</strong> {donation.donorName}</p>
                    <p className="card-text"><strong>Location:</strong> {donation.location}</p>
                    <p className="card-text"><strong>Contact:</strong> {donation.contactNumber}</p>
                    <p className="card-text">
                      <small className="text-muted">
                        Donated on: {new Date(donation.createdAt).toLocaleDateString()}
                      </small>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;