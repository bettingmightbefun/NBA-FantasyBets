const axios = require('axios');
const Game = require('../models/Game');
const Bet = require('../models/Bet');
const User = require('../models/User');

/**
 * Fetches game results from the NBA API and updates game statuses and bet outcomes
 */
async function updateGameResults() {
  try {
    console.log('Starting game results update process...');
    
    // Find games that are scheduled or in progress
    const pendingGames = await Game.find({
      status: { $in: ['scheduled', 'in_progress'] },
      startTime: { $lt: new Date() } // Only check games that have started
    });
    
    if (pendingGames.length === 0) {
      console.log('No pending games to update');
      return;
    }
    
    console.log(`Found ${pendingGames.length} pending games to check for results`);
    
    // Group games by date to minimize API calls
    const gamesByDate = {};
    pendingGames.forEach(game => {
      const gameDate = new Date(game.startTime);
      const year = gameDate.getFullYear();
      const month = String(gameDate.getMonth() + 1).padStart(2, '0');
      const day = String(gameDate.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;
      
      if (!gamesByDate[dateStr]) {
        gamesByDate[dateStr] = [];
      }
      gamesByDate[dateStr].push(game);
    });
    
    // Process each date
    for (const [dateStr, games] of Object.entries(gamesByDate)) {
      console.log(`Checking results for ${games.length} games on ${dateStr}`);
      
      try {
        // Fetch results from NBA API
        const response = await axios.get(`https://data.nba.net/prod/v1/${dateStr}/scoreboard.json`);
        const nbaGames = response.data.games;
        
        console.log(`NBA API returned ${nbaGames.length} games for ${dateStr}`);
        
        // Process each game
        for (const game of games) {
          // Find matching NBA game
          const nbaGame = nbaGames.find(nbaGame => {
            // Match by team names (case insensitive)
            const homeTeamMatch = nbaGame.hTeam.triCode.toLowerCase() === game.homeTeam.toLowerCase() ||
                                 nbaGame.hTeam.fullName.toLowerCase().includes(game.homeTeam.toLowerCase());
            const awayTeamMatch = nbaGame.vTeam.triCode.toLowerCase() === game.awayTeam.toLowerCase() ||
                                 nbaGame.vTeam.fullName.toLowerCase().includes(game.awayTeam.toLowerCase());
            return homeTeamMatch && awayTeamMatch;
          });
          
          if (!nbaGame) {
            console.log(`Could not find matching NBA game for ${game.awayTeam} @ ${game.homeTeam}`);
            continue;
          }
          
          // Check if game is finished
          if (nbaGame.statusNum === 3) { // 3 = finished
            console.log(`Game ${game.awayTeam} @ ${game.homeTeam} is finished`);
            
            // Update game status
            game.status = 'finished';
            
            // Get scores
            const homeScore = parseInt(nbaGame.hTeam.score);
            const awayScore = parseInt(nbaGame.vTeam.score);
            
            // Update game with scores
            game.homeScore = homeScore;
            game.awayScore = awayScore;
            
            // Determine winner
            let winner = null;
            if (homeScore > awayScore) {
              winner = 'home';
              console.log(`${game.homeTeam} (home) won`);
            } else if (awayScore > homeScore) {
              winner = 'away';
              console.log(`${game.awayTeam} (away) won`);
            } else {
              winner = 'tie';
              console.log('Game ended in a tie (unusual for NBA)');
            }
            
            // Save game
            await game.save();
            
            // Update bets for this game
            await updateBetsForGame(game._id, winner, homeScore, awayScore);
          } else if (nbaGame.statusNum === 2) { // 2 = in progress
            console.log(`Game ${game.awayTeam} @ ${game.homeTeam} is in progress`);
            
            // Update game status
            game.status = 'in_progress';
            await game.save();
          }
        }
      } catch (error) {
        console.error(`Error fetching results for date ${dateStr}:`, error.message);
      }
    }
    
    console.log('Game results update process completed');
  } catch (error) {
    console.error('Error updating game results:', error.message);
  }
}

/**
 * Updates bets for a specific game based on the result
 */
async function updateBetsForGame(gameId, winner, homeScore, awayScore) {
  try {
    // Find all bets for this game
    const bets = await Bet.find({ game: gameId, status: 'pending' });
    
    console.log(`Found ${bets.length} pending bets to settle for game ${gameId}`);
    
    for (const bet of bets) {
      let isWin = false;
      let payout = 0;
      
      // Determine if bet is a win based on bet type
      if (bet.betType === 'moneyline') {
        // Moneyline bet - straight win/loss
        isWin = (bet.pick === 'home' && winner === 'home') || 
                (bet.pick === 'away' && winner === 'away');
      } else if (bet.betType === 'spread') {
        // Spread bet
        const spreadValue = bet.pick === 'home' ? bet.spreadValue : -bet.spreadValue;
        const homeScoreAdjusted = homeScore + spreadValue;
        
        isWin = (bet.pick === 'home' && homeScoreAdjusted > awayScore) || 
                (bet.pick === 'away' && homeScoreAdjusted < awayScore);
                
        // Handle push (tie after spread)
        if (homeScoreAdjusted === awayScore) {
          bet.status = 'push';
          bet.result = 'push';
          payout = bet.amount; // Return the original stake
          
          // Update user balance
          const user = await User.findById(bet.user);
          user.balance += payout;
          await user.save();
          
          console.log(`Bet ${bet._id} resulted in a push, returning ${payout} to user ${bet.user}`);
          
          // Save bet
          bet.payout = payout;
          await bet.save();
          continue;
        }
      } else if (bet.betType === 'total') {
        // Total (over/under) bet
        const totalScore = homeScore + awayScore;
        
        isWin = (bet.pick === 'over' && totalScore > bet.totalValue) || 
                (bet.pick === 'under' && totalScore < bet.totalValue);
                
        // Handle push (exact total)
        if (totalScore === bet.totalValue) {
          bet.status = 'push';
          bet.result = 'push';
          payout = bet.amount; // Return the original stake
          
          // Update user balance
          const user = await User.findById(bet.user);
          user.balance += payout;
          await user.save();
          
          console.log(`Bet ${bet._id} resulted in a push, returning ${payout} to user ${bet.user}`);
          
          // Save bet
          bet.payout = payout;
          await bet.save();
          continue;
        }
      }
      
      // Update bet status and result
      bet.status = 'settled';
      bet.result = isWin ? 'win' : 'loss';
      
      // Calculate payout for winning bets
      if (isWin) {
        // Calculate payout based on odds
        const odds = bet.odds;
        
        if (odds > 0) {
          // Positive odds (e.g. +150)
          payout = bet.amount + (bet.amount * (odds / 100));
        } else {
          // Negative odds (e.g. -110)
          payout = bet.amount + (bet.amount * (100 / Math.abs(odds)));
        }
        
        // Round to 2 decimal places
        payout = Math.round(payout * 100) / 100;
        
        // Update user balance
        const user = await User.findById(bet.user);
        user.balance += payout;
        await user.save();
        
        console.log(`User ${bet.user} won bet ${bet._id}, paid out ${payout}`);
      } else {
        console.log(`User ${bet.user} lost bet ${bet._id}`);
      }
      
      // Save bet
      bet.payout = isWin ? payout : 0;
      await bet.save();
    }
    
    console.log(`Finished updating bets for game ${gameId}`);
  } catch (error) {
    console.error(`Error updating bets for game ${gameId}:`, error.message);
  }
}

module.exports = {
  updateGameResults
}; 