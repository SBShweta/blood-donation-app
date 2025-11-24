import React, { useState, useEffect } from 'react';
import api from "../utils/api";
import { Link } from 'react-router-dom';

const RecipientDashboard = () => {
  const [bloodRequests, setBloodRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBloodRequests = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('🔄 Fetching blood requests...');
        
        // ✅ CORRECTED API ENDPOINT - removed extra /api
        const response = await api.get('/blood-requests/my-requests');
        console.log('✅ Blood requests API Response:', response.data);

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setBloodRequests(response.data);
          console.log(`🎉 Loaded ${response.data.length} blood requests`);
        } else {
          setError('You have no blood requests yet.');
          console.log('ℹ️ No blood requests found for user');
        }
      } catch (err) {
        console.error('❌ Error fetching blood requests:', err);
        console.error('Error details:', err.response);
        setError(err.response?.data?.message || 'Failed to fetch your blood requests.');
      } finally {
        setLoading(false);
      }
    };

    fetchBloodRequests();
  }, []);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h2>Recipient Dashboard</h2>
        <Link to="/logout" className="btn btn-outline-danger">Logout</Link>
      </div>

      <p className="mt-3">Welcome to the Recipient Dashboard. You can request blood from available donors here.</p>

      {/* Link to Request Blood Page */}
      <div className="mt-4">
        <Link to="/request-blood" className="btn btn-primary">Request Blood</Link>
      </div>

      {/* Debug Info - Remove after fixing */}
      <div className="mt-3 p-3 bg-light border rounded">
        <h6>Debug Information:</h6>
        <p>Blood Requests in state: {bloodRequests.length}</p>
        <p>Loading: {loading.toString()}</p>
        <p>Error: {error || 'None'}</p>
      </div>

      {/* Displaying the user's own blood requests */}
      <div className="mt-5">
        <h4>Your Blood Requests</h4>
        
        {loading && (
          <div className="alert alert-info">
            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
            Loading blood requests...
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger mt-2">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {!loading && bloodRequests.length === 0 && !error && (
          <div className="alert alert-warning">
            You haven't made any blood requests yet. Click "Request Blood" to make your first request!
          </div>
        )}
        
        {bloodRequests.length > 0 && (
          <div className="row">
            {bloodRequests.map((request, index) => (
              <div className="col-md-6 mb-3" key={request._id || index}>
                <div className="card h-100">
                  <div className={`card-header ${
                    request.status === 'approved' ? 'bg-success' : 
                    request.status === 'rejected' ? 'bg-danger' : 'bg-warning'
                  } text-white`}>
                    <h5 className="card-title mb-0">
                      {request.bloodType} - 
                      <span className="text-capitalize"> {request.status}</span>
                    </h5>
                  </div>
                  <div className="card-body">
                    <p className="card-text"><strong>Requester:</strong> {request.requesterName}</p>
                    <p className="card-text"><strong>Hospital:</strong> {request.hospital}</p>
                    <p className="card-text"><strong>Contact:</strong> {request.contactNumber}</p>
                    <p className="card-text"><strong>Status:</strong> 
                      <span className={`badge ${
                        request.status === 'approved' ? 'bg-success' : 
                        request.status === 'rejected' ? 'bg-danger' : 'bg-warning'
                      } ms-2`}>
                        {request.status}
                      </span>
                    </p>
                    <p className="card-text">
                      <small className="text-muted">
                        Requested on: {new Date(request.createdAt).toLocaleDateString()}
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

export default RecipientDashboard;