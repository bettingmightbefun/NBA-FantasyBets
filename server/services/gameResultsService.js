const axios = require('axios');
const Game = require('../models/Game');
const Bet = require('../models/Bet');
const User = require('../models/User');

/**
 * Fetches game results from the NBA API
 * @param {Date} date - The date to fetch results for (defaults to today)
 * @returns {Promise<Array>} - Array of game results
 */
const fetchGameResults = async (date = new Date()) => {
  try {
    // Format date as YYYYMMDD for NBA API
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;
    
    console.log(`Fetching NBA game results for date: ${dateString}`);
    
    // Call the NBA API scoreboard endpoint
    const response = await axios.get(`https://data.nba.net/prod/v1/${dateString}/scoreboard.json`);
    
    if (!response.data || !response.data.games || !Array.isArray(response.data.games)) {
      console.log('No game data returned from NBA API');
      return [];
    }
    
    const games = response.data.games;
    console.log(`Found ${games.length} games for ${dateString}`);
    
    return games.map(game => ({
      gameId: `nba-${game.gameId}`,
      homeTeam: game.hTeam.triCode,
      homeScore: parseInt(game.hTeam.score),
      awayTeam: game.vTeam.triCode,
      awayScore: parseInt(game.vTeam.score),
      status: game.statusNum, // 1: scheduled, 2: in progress, 3: finished
      clock: game.clock,
      period: game.period.current,
      startTimeUTC: game.startTimeUTC,
      endTimeUTC: game.endTimeUTC
    }));
  } catch (error) {
    console.error('Error fetching game results from NBA API:', error.message);
    return [];
  }
};

/**
 * Updates game statuses in the database based on NBA API results
 */
const updateGameStatuses = async () => {
  try {
    console.log('Starting game status update process...');
    
    // Get today's date
    const today = new Date();
    
    // Get yesterday's date (to catch overnight games)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Fetch results for today and yesterday
    const todayResults = await fetchGameResults(today);
    const yesterdayResults = await fetchGameResults(yesterday);
    
    // Combine results
    const allResults = [...yesterdayResults, ...todayResults];
    
    if (allResults.length === 0) {
      console.log('No game results found to update');
      return;
    }
    
    console.log(`Processing ${allResults.length} game results`);
    
    // Update each game in our database
    for (const result of allResults) {
      // Find the game in our database
      const game = await Game.findOne({ gameId: result.gameId });
      
      if (!game) {
        console.log(`Game not found in database: ${result.gameId}`);
        continue;
      }
      
      // Update game status based on NBA API status
      if (result.status === 3) { // Game is finished
        console.log(`Updating finished game: ${game.homeTeam} vs ${game.awayTeam}`);
        
        // Update game with final score and status
        game.status = 'finished';
        game.homeScore = result.homeScore;
        game.awayScore = result.awayScore;
        game.lastUpdated = new Date();
        
        await game.save();
        console.log(`Game updated: ${game.homeTeam} ${game.homeScore} - ${game.awayScore} ${game.awayTeam}`);
        
        // Settle bets for this game
        await settleBetsForGame(game);
      } else if (result.status === 2 && game.status !== 'in_progress') { // Game is in progress
        console.log(`Updating in-progress game: ${game.homeTeam} vs ${game.awayTeam}`);
        
        // Update game with current score and status
        game.status = 'in_progress';
        game.homeScore = result.homeScore;
        game.awayScore = result.awayScore;
        game.lastUpdated = new Date();
        
        await game.save();
      }
    }
    
    console.log('Game status update completed');
  } catch (error) {
    console.error('Error updating game statuses:', error);
  }
};

/**
 * Settles all bets for a finished game
 * @param {Object} game - The finished game object
 */
const settleBetsForGame = async (game) => {
  try {
    console.log(`Settling bets for game: ${game.homeTeam} vs ${game.awayTeam}`);
    
    // Find all pending bets for this game
    const pendingBets = await Bet.find({ 
      gameId: game.gameId,
      status: { $in: ['pending', 'live'] }
    });
    
    console.log(`Found ${pendingBets.length} pending bets to settle`);
    
    for (const bet of pendingBets) {
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
    }
    
    console.log(`All bets settled for game: ${game.homeTeam} vs ${game.awayTeam}`);
  } catch (error) {
    console.error(`Error settling bets for game ${game.gameId}:`, error);
  }
};

/**
 * Manually settles all pending bets for games that have finished
 * This can be used to fix any bets that weren't automatically settled
 */
const manuallySettleAllPendingBets = async () => {
  try {
    console.log('Starting manual settlement of all pending bets...');
    
    // Find all finished games
    const finishedGames = await Game.find({ status: 'finished' });
    console.log(`Found ${finishedGames.length} finished games`);
    
    // Settle bets for each finished game
    for (const game of finishedGames) {
      await settleBetsForGame(game);
    }
    
    console.log('Manual settlement completed');
  } catch (error) {
    console.error('Error in manual settlement:', error);
  }
};

module.exports = {
  fetchGameResults,
  updateGameStatuses,
  settleBetsForGame,
  manuallySettleAllPendingBets
}; 