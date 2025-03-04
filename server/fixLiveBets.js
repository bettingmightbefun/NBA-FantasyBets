const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Bet = require('./models/Bet');
const Game = require('./models/Game');
const User = require('./models/User');
const { fetchGameResults } = require('./services/gameResultsService');

// Load environment variables
dotenv.config();

/**
 * Fix live bets that should be settled
 */
const fixLiveBets = async () => {
  try {
    console.log('Starting to fix live bets...');
    
    // Find all bets with 'live' status
    const liveBets = await Bet.find({ status: 'live' });
    console.log(`Found ${liveBets.length} live bets`);
    
    if (liveBets.length === 0) {
      console.log('No live bets to fix');
      return;
    }
    
    // Get unique game IDs from live bets
    const gameIds = [...new Set(liveBets.map(bet => bet.gameId))];
    console.log(`These bets are for ${gameIds.length} unique games`);
    
    // Fetch current game results for the past 3 days
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const todayResults = await fetchGameResults(today);
    const yesterdayResults = await fetchGameResults(yesterday);
    const twoDaysAgoResults = await fetchGameResults(twoDaysAgo);
    
    const allResults = [...todayResults, ...yesterdayResults, ...twoDaysAgoResults];
    console.log(`Fetched ${allResults.length} game results from NBA API`);
    
    // Process each live bet
    for (const bet of liveBets) {
      console.log(`Processing bet ${bet._id} for game ${bet.gameId}`);
      
      // Find the game in our database
      const game = await Game.findOne({ gameId: bet.gameId });
      
      if (!game) {
        console.log(`Game not found in database: ${bet.gameId}`);
        continue;
      }
      
      // Find the game result from NBA API
      const gameResult = allResults.find(result => result.gameId === bet.gameId);
      
      if (!gameResult) {
        console.log(`Game result not found in NBA API: ${bet.gameId}`);
        continue;
      }
      
      // Check if the game is finished (status 3)
      if (gameResult.status === 3) {
        console.log(`Game ${bet.gameId} is finished. Updating game and settling bet...`);
        
        // Update game with final score and status
        game.status = 'finished';
        game.homeScore = gameResult.homeScore;
        game.awayScore = gameResult.awayScore;
        game.lastUpdated = new Date();
        
        await game.save();
        console.log(`Game updated: ${game.homeTeam} ${game.homeScore} - ${game.awayScore} ${game.awayTeam}`);
        
        // Determine if bet is a win or loss
        let isWin = false;
        
        if (bet.betType === 'moneyline') {
          if (bet.pick === 'home') {
            isWin = game.homeScore > game.awayScore;
          } else {
            isWin = game.awayScore > game.homeScore;
          }
        } else if (bet.betType === 'spread') {
          if (bet.pick === 'home') {
            isWin = (game.homeScore + bet.line) > game.awayScore;
          } else {
            isWin = (game.awayScore + bet.line) > game.homeScore;
          }
        } else if (bet.betType === 'total') {
          const totalScore = game.homeScore + game.awayScore;
          if (bet.pick === 'over') {
            isWin = totalScore > bet.line;
          } else {
            isWin = totalScore < bet.line;
          }
        }
        
        // Update bet status
        bet.status = isWin ? 'won' : 'lost';
        bet.settledAt = new Date();
        
        // Calculate payout if bet won
        if (isWin) {
          const payout = bet.amount * bet.odds;
          
          // Update user balance
          const user = await User.findById(bet.userId);
          if (user) {
            user.balance += payout;
            await user.save();
            console.log(`User ${user.username} won ${payout} on bet ${bet._id}`);
          }
        }
        
        await bet.save();
        console.log(`Bet ${bet._id} settled as ${bet.status}`);
      } else {
        console.log(`Game ${bet.gameId} is not finished yet (status: ${gameResult.status})`);
      }
    }
    
    console.log('Finished fixing live bets');
  } catch (error) {
    console.error('Error fixing live bets:', error);
  }
};

// Connect to MongoDB and run the fix
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully');
    
    try {
      await fixLiveBets();
      console.log('Process completed successfully');
    } catch (error) {
      console.error('Error during fix process:', error);
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