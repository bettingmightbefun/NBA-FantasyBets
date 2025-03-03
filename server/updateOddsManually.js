require('dotenv').config();
const mongoose = require('mongoose');
const { updateOdds } = require('./services/oddsService');

async function runOddsUpdate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    console.log('Running manual odds update...');
    await updateOdds();
    console.log('Manual odds update completed');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

runOddsUpdate(); 