const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { updateGameStatuses, manuallySettleAllPendingBets } = require('./services/gameResultsService');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully');
    
    try {
      // Update game statuses from NBA API
      console.log('Updating game statuses...');
      await updateGameStatuses();
      
      // Manually settle any pending bets for finished games
      console.log('Settling pending bets...');
      await manuallySettleAllPendingBets();
      
      console.log('Process completed successfully');
    } catch (error) {
      console.error('Error during update process:', error);
    } finally {
      // Close the MongoDB connection
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }); 