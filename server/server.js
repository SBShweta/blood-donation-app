// // server.js
// require('dotenv').config();

// const express = require('express');
// const dotenv = require('dotenv');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const userRoutes = require('./routes/userRoutes');
// const bloodRequestRoutes = require('./routes/bloodRequestRoutes'); 
// const donationRoutes = require('./routes/donationRoutes');  


// // Load .env variables
// dotenv.config();

// // Initialize Express app
// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json()); // for parsing application/json
// app.use('/api/auth', require('./routes/auth'));

// //routes
// app.use('/api/users', userRoutes); 
// app.use('/api/blood-requests', bloodRequestRoutes);
// app.use('/api/donations', donationRoutes);

// // Connect to MongoDB
// connectDB();

// // Example Route
// app.get('/', (req, res) => {
//   res.send('Blood Donation API is running');
// });

// // Port
// const PORT = process.env.PORT || 5000;

// app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
const PORT = process.env.PORT || 5000;

// Initialize Express app
const app = express();

// CORS configuration for production
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// Middleware
app.use(express.json());

// Health check route
app.use('/api', require('./routes/health'));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/userRoutes')); 
app.use('/api/blood-requests', require('./routes/bloodRequestRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Blood Donation API Server',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();