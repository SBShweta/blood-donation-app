
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');


const PORT = process.env.PORT || 5000;


const app = express();


app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));


app.use(express.json());


app.use('/api', require('./routes/health'));


app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/userRoutes')); 
app.use('/api/blood-requests', require('./routes/bloodRequestRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));


app.get('/', (req, res) => {
  res.json({ 
    message: 'Blood Donation API Server',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});


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