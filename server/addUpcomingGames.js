require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./models/Game');

async function addUpcomingGames() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Current date for reference
    const now = new Date();
    console.log(`Current date: ${now.toLocaleString()}`);
    
    // Create some upcoming games for today and tomorrow
    const upcomingGames = [
      // Today's games (March 3rd)
      {
        gameId: `nba-20240303-bos-lal`,
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Boston Celtics',
        startTime: new Date(2024, 2, 3, 20, 30), // March 3rd, 8:30 PM
        status: 'scheduled',
        odds: {
          moneyline: { home: -110, away: -110 },
          spread: { home: -1.5, homeOdds: -110, away: 1.5, awayOdds: -110 },
          total: { over: 220.5, overOdds: -110, under: 220.5, underOdds: -110 }
        }
      },
      {
        gameId: `nba-20240303-den-gsw`,
        homeTeam: 'Golden State Warriors',
        awayTeam: 'Denver Nuggets',
        startTime: new Date(2024, 2, 3, 21, 0), // March 3rd, 9:00 PM
        status: 'scheduled',
        odds: {
          moneyline: { home: -120, away: +100 },
          spread: { home: -2, homeOdds: -110, away: 2, awayOdds: -110 },
          total: { over: 225.5, overOdds: -110, under: 225.5, underOdds: -110 }
        }
      },
      
      // Tomorrow's games (March 4th)
      {
        gameId: `nba-20240304-mil-nyk`,
        homeTeam: 'New York Knicks',
        awayTeam: 'Milwaukee Bucks',
        startTime: new Date(2024, 2, 4, 19, 30), // March 4th, 7:30 PM
        status: 'scheduled',
        odds: {
          moneyline: { home: -105, away: -115 },
          spread: { home: -1, homeOdds: -110, away: 1, awayOdds: -110 },
          total: { over: 218.5, overOdds: -110, under: 218.5, underOdds: -110 }
        }
      },
      {
        gameId: `nba-20240304-phi-mia`,
        homeTeam: 'Miami Heat',
        awayTeam: 'Philadelphia 76ers',
        startTime: new Date(2024, 2, 4, 19, 30), // March 4th, 7:30 PM
        status: 'scheduled',
        odds: {
          moneyline: { home: -130, away: +110 },
          spread: { home: -3, homeOdds: -110, away: 3, awayOdds: -110 },
          total: { over: 215.5, overOdds: -110, under: 215.5, underOdds: -110 }
        }
      }
    ];
    
    // Insert the games
    for (const game of upcomingGames) {
      // Check if game already exists
      const existingGame = await Game.findOne({ gameId: game.gameId });
      
      if (existingGame) {
        console.log(`Game already exists: ${game.homeTeam} vs ${game.awayTeam}`);
      } else {
        const newGame = new Game(game);
        await newGame.save();
        console.log(`Added new game: ${game.homeTeam} vs ${game.awayTeam} on ${new Date(game.startTime).toLocaleString()}`);
      }
    }
    
    // Get all games
    const allGames = await Game.find({ status: 'scheduled' }).sort({ startTime: 1 });
    
    console.log('\nAll scheduled games:');
    allGames.forEach(game => {
      console.log(`- ${game.homeTeam} vs ${game.awayTeam}, ${new Date(game.startTime).toLocaleString()}, Status: ${game.status}`);
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
addUpcomingGames(); 