require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./models/Game');

async function fixGames() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get all games
    const games = await Game.find();
    console.log(`Found ${games.length} games in the database`);
    
    // Current date for reference
    const now = new Date();
    console.log(`Current date: ${now.toLocaleString()}`);
    
    // Calculate date 48 hours from now
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 48);
    console.log(`Future cutoff date: ${futureDate.toLocaleString()}`);
    
    // Track changes
    let pastGamesFixed = 0;
    let futureGamesRemoved = 0;
    let yearsFixed = 0;
    
    // First, fix all the years
    for (const game of games) {
      let gameDate = new Date(game.startTime);
      
      // Fix the year (if it's 2025, change to 2024)
      if (gameDate.getFullYear() === 2025) {
        gameDate.setFullYear(2024);
        game.startTime = gameDate;
        yearsFixed++;
        await game.save();
        console.log(`Fixed year for game: ${game.homeTeam} vs ${game.awayTeam}, new date: ${gameDate.toLocaleString()}`);
      }
    }
    
    // Get all games again with fixed years
    const updatedGames = await Game.find();
    
    // Now handle past and future games
    for (const game of updatedGames) {
      const gameDate = new Date(game.startTime);
      
      // Check if game is in the past (March 2nd or earlier)
      const isYesterday = gameDate.getDate() <= 2 && gameDate.getMonth() === 2; // March 2nd or earlier
      
      if (isYesterday && game.status === 'scheduled') {
        game.status = 'finished';
        pastGamesFixed++;
        await game.save();
        console.log(`Marked past game as finished: ${game.homeTeam} vs ${game.awayTeam} on ${gameDate.toLocaleString()}`);
      }
      
      // Check if game is too far in the future (March 5th or later)
      const isTooFarFuture = gameDate.getDate() >= 5 && gameDate.getMonth() === 2; // March 5th or later
      
      if (isTooFarFuture) {
        console.log(`Removing future game: ${game.homeTeam} vs ${game.awayTeam} on ${gameDate.toLocaleString()}`);
        await Game.deleteOne({ _id: game._id });
        futureGamesRemoved++;
      }
    }
    
    // Summary of changes
    console.log('\nSummary of changes:');
    console.log(`- Fixed years for ${yearsFixed} games (2025 → 2024)`);
    console.log(`- Marked ${pastGamesFixed} past games as finished`);
    console.log(`- Removed ${futureGamesRemoved} games that were more than 48 hours in the future`);
    
    // Get updated games count
    const finalGamesCount = await Game.countDocuments();
    console.log(`\nTotal games in database after fixes: ${finalGamesCount}`);
    
    // Now let's check what games are left
    console.log('\nRemaining games:');
    const remainingGames = await Game.find().sort({ startTime: 1 });
    remainingGames.forEach(game => {
      const gameDate = new Date(game.startTime);
      console.log(`- ${game.homeTeam} vs ${game.awayTeam}, ${gameDate.toLocaleString()}, Status: ${game.status}`);
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
fixGames(); 