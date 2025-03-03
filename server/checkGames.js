require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./models/Game');

async function checkGames() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get all games
    const games = await Game.find().sort({ startTime: 1 });
    
    console.log(`Found ${games.length} games in the database`);
    
    // Current date for reference
    const now = new Date();
    console.log(`Current date: ${now.toLocaleString()}`);
    
    // Display all games
    games.forEach(game => {
      const gameDate = new Date(game.startTime);
      const isPast = gameDate < now;
      const hoursFromNow = (gameDate - now) / (1000 * 60 * 60);
      
      console.log(`
ID: ${game._id}
Teams: ${game.homeTeam} vs ${game.awayTeam}
Start Time: ${gameDate.toLocaleString()}
Status: ${game.status}
${isPast ? 'PAST GAME' : `${Math.round(hoursFromNow)} hours from now`}
-------------------`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
checkGames(); 