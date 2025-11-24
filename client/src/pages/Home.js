import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Legend
} from 'recharts';

const bloodData = [
  { name: 'A+', value: 30 },
  { name: 'B+', value: 20 },
  { name: 'O+', value: 25 },
  { name: 'AB+', value: 10 },
  { name: 'A-', value: 5 },
  { name: 'B-', value: 3 },
  { name: 'O-', value: 4 },
  { name: 'AB-', value: 3 },
];

const donationData = [
  { name: 'Jan', donations: 20 },
  { name: 'Feb', donations: 35 },
  { name: 'Mar', donations: 50 },
  { name: 'Apr', donations: 45 },
];

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4', '#795548'];

const bloodInfo = [
  { type: 'A+', compatible: 'A+, AB+', donateTo: 'A+, AB+', receiveFrom: 'A+, A-, O+, O-' },
  { type: 'A-', compatible: 'A+, A-, AB+, AB-', donateTo: 'A+, A-, AB+, AB-', receiveFrom: 'A-, O-' },
  { type: 'B+', compatible: 'B+, AB+', donateTo: 'B+, AB+', receiveFrom: 'B+, B-, O+, O-' },
  { type: 'B-', compatible: 'B+, B-, AB+, AB-', donateTo: 'B+, B-, AB+, AB-', receiveFrom: 'B-, O-' },
  { type: 'AB+', compatible: 'Universal Recipient', donateTo: 'AB+', receiveFrom: 'All types' },
  { type: 'AB-', compatible: 'AB+, AB-', donateTo: 'AB+, AB-', receiveFrom: 'AB-, A-, B-, O-' },
  { type: 'O+', compatible: 'A+, B+, AB+, O+', donateTo: 'A+, B+, AB+, O+', receiveFrom: 'O+, O-' },
  { type: 'O-', compatible: 'Universal Donor', donateTo: 'All types', receiveFrom: 'O-' },
];

const Home = () => {
  return (
    <div className="container mt-4">
      <h1 className="mb-4">Welcome to Blood Donation Portal</h1>

      {/* Charts */}
      <div className="row mb-5">
        <div className="col-md-6">
          <h5>Blood Type Distribution</h5>
          <PieChart width={300} height={300}>
            <Pie
              data={bloodData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {bloodData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        <div className="col-md-6">
          <h5>Monthly Donations</h5>
          <BarChart width={400} height={300} data={donationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="donations" fill="#8884d8" />
          </BarChart>
        </div>
      </div>

      {/* Stats */}
      <div className="row text-center mb-5">
        <div className="col-md-4">
          <h6>Total Donors</h6>
          <p className="display-6">150</p>
        </div>
        <div className="col-md-4">
          <h6>Total Requests</h6>
          <p className="display-6">60</p>
        </div>
        <div className="col-md-4">
          <h6>Successful Donations</h6>
          <p className="display-6">45</p>
        </div>
      </div>

      {/* Blood Info */}
      <h3 className="mb-4">Blood Type Compatibility</h3>
      <div className="row">
        {bloodInfo.map((info, idx) => (
          <div className="col-md-3 mb-4" key={idx}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title text-center">{info.type}</h5>
                <p><strong>Can Donate To:</strong> {info.donateTo}</p>
                <p><strong>Can Receive From:</strong> {info.receiveFrom}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
