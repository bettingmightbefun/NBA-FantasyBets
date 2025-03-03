const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const betRoutes = require('./routes/bets');
const oddsRoutes = require('./routes/odds');

// Import services
const { updateOdds } = require('./services/oddsService');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB with enhanced error handling
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log('Database name:', mongoose.connection.name);
    console.log('MongoDB version:', mongoose.version);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Error code:', err.code);
    console.error('Error name:', err.name);
    
    // Check for common connection errors
    if (err.name === 'MongoServerSelectionError') {
      console.error('Could not connect to any MongoDB server. Please check:');
      console.error('1. Network connectivity');
      console.error('2. MongoDB Atlas IP whitelist settings');
      console.error('3. MongoDB Atlas username and password');
    }
    
    if (err.code === 'ENOTFOUND') {
      console.error('Host not found. Please check the MongoDB URI hostname.');
    }
    
    if (err.message.includes('Authentication failed')) {
      console.error('Authentication failed. Please check username and password in the MongoDB URI.');
    }
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/odds', oddsRoutes);

// Schedule odds updates every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running scheduled odds update');
  try {
    await updateOdds();
    console.log('Odds updated successfully');
  } catch (error) {
    console.error('Error updating odds:', error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 