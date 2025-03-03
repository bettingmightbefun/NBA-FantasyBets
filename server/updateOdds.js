require('dotenv').config();
const mongoose = require('mongoose');
const { updateOdds } = require('./services/oddsService');

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Update odds
    console.log('Updating odds...');
    await updateOdds();
    console.log('Odds updated successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

main(); 