require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./models/Game');

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check games
    const games = await Game.find({});
    console.log(`Found ${games.length} games in the database`);
    
    if (games.length > 0) {
      console.log('Sample game:');
      console.log(JSON.stringify(games[0], null, 2));
    }
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