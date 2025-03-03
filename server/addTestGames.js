require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./models/Game');

const testGames = [
  {
    gameId: 'test-game-1',
    homeTeam: 'Los Angeles Lakers',
    awayTeam: 'Boston Celtics',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    status: 'scheduled',
    odds: {
      moneyline: {
        home: -150,
        away: +130
      },
      spread: {
        home: -3.5,
        homeOdds: -110,
        away: +3.5,
        awayOdds: -110
      },
      total: {
        over: 220.5,
        overOdds: -110,
        under: 220.5,
        underOdds: -110
      }
    }
  },
  {
    gameId: 'test-game-2',
    homeTeam: 'Golden State Warriors',
    awayTeam: 'Brooklyn Nets',
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    status: 'scheduled',
    odds: {
      moneyline: {
        home: -200,
        away: +170
      },
      spread: {
        home: -5.5,
        homeOdds: -110,
        away: +5.5,
        awayOdds: -110
      },
      total: {
        over: 230.5,
        overOdds: -110,
        under: 230.5,
        underOdds: -110
      }
    }
  },
  {
    gameId: 'test-game-3',
    homeTeam: 'Miami Heat',
    awayTeam: 'Chicago Bulls',
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    status: 'scheduled',
    odds: {
      moneyline: {
        home: -120,
        away: +100
      },
      spread: {
        home: -1.5,
        homeOdds: -110,
        away: +1.5,
        awayOdds: -110
      },
      total: {
        over: 210.5,
        overOdds: -110,
        under: 210.5,
        underOdds: -110
      }
    }
  }
];

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing test games
    await Game.deleteMany({ gameId: { $in: testGames.map(game => game.gameId) } });
    console.log('Cleared existing test games');
    
    // Add test games
    const result = await Game.insertMany(testGames);
    console.log(`Added ${result.length} test games to the database`);
    
    // List all games
    const allGames = await Game.find({});
    console.log(`Total games in database: ${allGames.length}`);
    
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