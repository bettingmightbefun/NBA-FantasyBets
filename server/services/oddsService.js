const axios = require('axios');
const Game = require('../models/Game');
const Bet = require('../models/Bet');
const User = require('../models/User');

// Function to fetch additional NBA games from the NBA API
async function fetchAdditionalNBAGames() {
  try {
    console.log('Fetching additional NBA games from NBA API...');
    
    // Get current date
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tYear = tomorrow.getFullYear();
    const tMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tDay = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowStr = `${tYear}${tMonth}${tDay}`;
    
    console.log(`Fetching games for today (${dateStr}) and tomorrow (${tomorrowStr})...`);
    
    // Use the NBA API to get scheduled games
    // This is a public NBA API endpoint that doesn't require authentication
    const response = await axios.get(`https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json`);
    
    if (!response.data || !response.data.leagueSchedule || !response.data.leagueSchedule.gameDates) {
      console.log('No data returned from NBA API');
      return [];
    }
    
    const gameDates = response.data.leagueSchedule.gameDates;
    console.log(`NBA API returned ${gameDates.length} game dates`);
    
    // Filter for today and tomorrow's games
    const relevantDates = gameDates.filter(gameDate => {
      const date = new Date(gameDate.gameDate);
      const dateString = date.toISOString().split('T')[0].replace(/-/g, '');
      return dateString === dateStr || dateString === tomorrowStr;
    });
    
    console.log(`Found ${relevantDates.length} relevant dates with games`);
    
    // Extract games
    const additionalGames = [];
    
    relevantDates.forEach(gameDate => {
      const dateObj = new Date(gameDate.gameDate);
      const dateString = dateObj.toDateString();
      console.log(`\nProcessing games for ${dateString}:`);
      
      gameDate.games.forEach(game => {
        const homeTeam = game.homeTeam.teamName;
        const awayTeam = game.awayTeam.teamName;
        const gameTimeUTC = game.gameDateTimeUTC;
        const startTime = new Date(gameTimeUTC);
        const gameId = `nba-${game.gameId}`;
        
        console.log(`- ${homeTeam} vs ${awayTeam}, ${startTime.toLocaleString()}`);
        
        additionalGames.push({
          gameId,
          homeTeam,
          awayTeam,
          startTime,
          status: 'scheduled',
          odds: {
            moneyline: { home: -110, away: -110 },  // Default odds
            spread: { home: -1.5, homeOdds: -110, away: 1.5, awayOdds: -110 },
            total: { over: 220.5, overOdds: -110, under: 220.5, underOdds: -110 }
          }
        });
      });
    });
    
    console.log(`Total additional games found: ${additionalGames.length}`);
    return additionalGames;
  } catch (error) {
    console.error('Error fetching additional NBA games:', error);
    return [];
  }
}

// Function to fetch NBA games and odds from external API
exports.updateOdds = async () => {
  try {
    console.log('Starting odds update process...');
    
    // Get current date for logging
    const now = new Date();
    console.log(`Current date: ${now.toLocaleString()}`);
    
    // Using The Odds API (https://the-odds-api.com/)
    console.log('Fetching data from The Odds API...');
    const response = await axios.get(`https://api.the-odds-api.com/v4/sports/basketball_nba/odds`, {
      params: {
        apiKey: process.env.ODDS_API_KEY,
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american',
        dateFormat: 'iso'
      }
    });

    // Log API request limits
    const remainingRequests = response.headers['x-requests-remaining'];
    const usedRequests = response.headers['x-requests-used'];
    console.log(`API Rate Limit: ${usedRequests} requests used, ${remainingRequests} requests remaining`);

    console.log(`API Response received. Found ${response.data?.length || 0} games.`);
    
    // Log all games received from the API
    console.log('Games received from The Odds API:');
    if (response.data && Array.isArray(response.data)) {
      response.data.forEach((game, index) => {
        const gameDate = new Date(game.commence_time);
        console.log(`${index + 1}. ${game.home_team} vs ${game.away_team} - ${gameDate.toLocaleString()} (${gameDate.toDateString()})`);
      });
    }

    // Fetch additional games from NBA API
    const additionalGames = await fetchAdditionalNBAGames();
    console.log(`Fetched ${additionalGames.length} additional games from NBA API`);

    // Mark past games as finished
    await updatePastGames();
    
    // Remove games that are more than 24 hours in the past
    await removeOldGames();

    // Process games from The Odds API
    if (response.data && Array.isArray(response.data)) {
      // Count new and updated games
      let newGamesCount = 0;
      let updatedGamesCount = 0;
      
      // Group games by date for logging
      const gamesByDate = {};
      
      for (const gameData of response.data) {
        // Extract game information
        const gameId = gameData.id;
        const homeTeam = gameData.home_team;
        const awayTeam = gameData.away_team;
        const startTime = new Date(gameData.commence_time);
        const dateString = startTime.toDateString();
        
        // Add to games by date
        if (!gamesByDate[dateString]) {
          gamesByDate[dateString] = [];
        }
        gamesByDate[dateString].push(`${homeTeam} vs ${awayTeam}`);
        
        console.log(`Processing game: ${homeTeam} vs ${awayTeam} at ${startTime.toLocaleString()}`);

        // Check if the game is in the future
        const now = new Date();
        if (startTime < now) {
          console.log(`Skipping past game: ${homeTeam} vs ${awayTeam}`);
          continue;
        }

        // Find or create game in our database
        let game = await Game.findOne({ gameId });

        if (!game) {
          // Create new game
          console.log(`Creating new game: ${homeTeam} vs ${awayTeam}`);
          game = new Game({
            gameId,
            homeTeam,
            awayTeam,
            startTime,
            status: 'scheduled',
            odds: {
              moneyline: {},
              spread: {},
              total: {}
            }
          });
          newGamesCount++;
        } else {
          // Update existing game
          console.log(`Updating existing game: ${homeTeam} vs ${awayTeam}`);
          game.homeTeam = homeTeam;
          game.awayTeam = awayTeam;
          game.startTime = startTime;
          
          // Only update status if the game is not already finished
          if (game.status !== 'finished') {
            game.status = 'scheduled';
          }
          updatedGamesCount++;
        }

        // Update odds
        let oddsUpdated = false;
        for (const bookmaker of gameData.bookmakers) {
          for (const market of bookmaker.markets) {
            if (market.key === 'h2h') {
              // Moneyline odds
              for (const outcome of market.outcomes) {
                if (outcome.name === homeTeam) {
                  game.odds.moneyline.home = outcome.price;
                  oddsUpdated = true;
                } else if (outcome.name === awayTeam) {
                  game.odds.moneyline.away = outcome.price;
                  oddsUpdated = true;
                }
              }
            } else if (market.key === 'spreads') {
              // Spread odds
              for (const outcome of market.outcomes) {
                if (outcome.name === homeTeam) {
                  game.odds.spread.home = outcome.point;
                  game.odds.spread.homeOdds = outcome.price;
                  oddsUpdated = true;
                } else if (outcome.name === awayTeam) {
                  game.odds.spread.away = outcome.point;
                  game.odds.spread.awayOdds = outcome.price;
                  oddsUpdated = true;
                }
              }
            } else if (market.key === 'totals') {
              // Total (over/under) odds
              for (const outcome of market.outcomes) {
                if (outcome.name === 'Over') {
                  game.odds.total.over = outcome.point;
                  game.odds.total.overOdds = outcome.price;
                  oddsUpdated = true;
                } else if (outcome.name === 'Under') {
                  game.odds.total.under = outcome.point;
                  game.odds.total.underOdds = outcome.price;
                  oddsUpdated = true;
                }
              }
            }
          }
        }

        if (oddsUpdated) {
          // Update last updated timestamp
          game.lastUpdated = new Date();
          await game.save();
          console.log(`Saved game: ${homeTeam} vs ${awayTeam}`);
        } else {
          console.log(`No odds updates for game: ${homeTeam} vs ${awayTeam}`);
        }
      }
      
      // Process additional games from NBA API
      console.log('\nProcessing additional games from NBA API...');
      for (const gameData of additionalGames) {
        const { gameId, homeTeam, awayTeam, startTime, status, odds } = gameData;
        const dateString = startTime.toDateString();
        
        // Add to games by date
        if (!gamesByDate[dateString]) {
          gamesByDate[dateString] = [];
        }
        if (!gamesByDate[dateString].includes(`${homeTeam} vs ${awayTeam}`)) {
          gamesByDate[dateString].push(`${homeTeam} vs ${awayTeam}`);
        }
        
        console.log(`Processing additional game: ${homeTeam} vs ${awayTeam} at ${startTime.toLocaleString()}`);
        
        // Check if the game is in the future
        if (startTime < now) {
          console.log(`Skipping past game: ${homeTeam} vs ${awayTeam}`);
          continue;
        }
        
        // Check if game already exists (by teams and date, since IDs might be different)
        const existingGame = await Game.findOne({
          $or: [
            { gameId },
            {
              homeTeam,
              awayTeam,
              startTime: {
                $gte: new Date(startTime.setHours(0, 0, 0, 0)),
                $lt: new Date(startTime.setHours(23, 59, 59, 999))
              }
            }
          ]
        });
        
        if (!existingGame) {
          // Create new game
          console.log(`Creating new additional game: ${homeTeam} vs ${awayTeam}`);
          const newGame = new Game({
            gameId,
            homeTeam,
            awayTeam,
            startTime,
            status,
            odds
          });
          await newGame.save();
          newGamesCount++;
          console.log(`Saved additional game: ${homeTeam} vs ${awayTeam}`);
        } else {
          console.log(`Game already exists: ${homeTeam} vs ${awayTeam}`);
        }
      }
    }

    // Log summary of games in database
    const scheduledGames = await Game.find({ status: 'scheduled' }).sort({ startTime: 1 });
    console.log(`\nCurrent scheduled games in database: ${scheduledGames.length}`);
    
    // Group games by date for better logging
    const dbGamesByDate = {};
    scheduledGames.forEach(game => {
      const dateString = new Date(game.startTime).toDateString();
      if (!dbGamesByDate[dateString]) {
        dbGamesByDate[dateString] = [];
      }
      dbGamesByDate[dateString].push(`${game.homeTeam} vs ${game.awayTeam}`);
    });
    
    // Log games by date
    console.log('\nGames by date:');
    Object.keys(dbGamesByDate).sort().forEach(date => {
      console.log(`\n${date} (${dbGamesByDate[date].length} games):`);
      dbGamesByDate[date].forEach((game, index) => {
        console.log(`  ${index + 1}. ${game}`);
      });
    });
    
    // Log games grouped by date from API response
    console.log('\nAPI games by date:');
    Object.keys(gamesByDate).sort().forEach(date => {
      console.log(`\n${date} (${gamesByDate[date].length} games):`);
      gamesByDate[date].forEach((game, index) => {
        console.log(`  ${index + 1}. ${game}`);
      });
    });

    console.log(`\nOdds update summary: ${newGamesCount} new games added, ${updatedGamesCount} existing games updated`);
    console.log('Odds update process completed successfully');
    return true;
  } catch (error) {
    console.error('Error updating odds:', error);
    throw error;
  }
};

// Function to mark past games as finished
async function updatePastGames() {
  try {
    const now = new Date();
    console.log(`Marking past games as finished (current time: ${now.toLocaleString()})...`);
    
    // Find scheduled games that have already started
    const pastGames = await Game.find({
      status: 'scheduled',
      startTime: { $lt: now }
    });
    
    console.log(`Found ${pastGames.length} past games to mark as finished`);
    
    for (const game of pastGames) {
      game.status = 'finished';
      await game.save();
      console.log(`Marked game as finished: ${game.homeTeam} vs ${game.awayTeam} (${new Date(game.startTime).toLocaleString()})`);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating past games:', error);
    throw error;
  }
}

// Function to remove old games (more than 24 hours in the past)
async function removeOldGames() {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    console.log(`Removing games older than 24 hours (before ${oneDayAgo.toLocaleString()})...`);
    
    // Find and remove old finished games
    const result = await Game.deleteMany({
      status: 'finished',
      startTime: { $lt: oneDayAgo }
    });
    
    console.log(`Removed ${result.deletedCount} old games`);
    
    return true;
  } catch (error) {
    console.error('Error removing old games:', error);
    throw error;
  }
}

// Function to update game status and settle bets
exports.updateGameResults = async () => {
  try {
    console.log('Starting game results update process...');
    
    // For now, we'll just mark past games as finished
    // In a real implementation, you would fetch actual scores from an NBA API
    await updatePastGames();
    
    console.log('Game results update process completed');
    return true;
  } catch (error) {
    console.error('Error updating game results:', error);
    throw error;
  }
};

// Function to settle bets for a finished game
async function settleBets(game) {
  try {
    // Find all pending bets for this game
    const bets = await Bet.find({
      game: game._id,
      status: 'pending'
    });

    console.log(`Settling ${bets.length} bets for game ${game._id} (${game.homeTeam} vs ${game.awayTeam})`);

    for (const bet of bets) {
      let isWin = false;

      // Determine if bet is a win based on bet type and selection
      switch (bet.betType) {
        case 'moneyline':
          if (bet.betSelection === game.homeTeam) {
            isWin = game.homeScore > game.awayScore;
          } else {
            isWin = game.awayScore > game.homeScore;
          }
          break;
        case 'spread':
          if (bet.betSelection === game.homeTeam) {
            isWin = (game.homeScore + game.odds.spread.home) > game.awayScore;
          } else {
            isWin = (game.awayScore + game.odds.spread.away) > game.homeScore;
          }
          break;
        case 'total':
          const totalScore = game.homeScore + game.awayScore;
          if (bet.betSelection === 'over') {
            isWin = totalScore > game.odds.total.over;
          } else {
            isWin = totalScore < game.odds.total.under;
          }
          break;
      }

      // Update bet status
      bet.status = isWin ? 'won' : 'lost';
      bet.settledAt = Date.now();
      await bet.save();
      console.log(`Bet ${bet._id} marked as ${bet.status}`);

      // Update user stats
      const user = await User.findById(bet.user);
      if (user) {
        if (isWin) {
          // Add winnings to user balance
          user.balance += (bet.amount + bet.potentialWinnings);
          user.betsWon += 1;
          user.totalWon += bet.potentialWinnings;
          console.log(`User ${user.username} won ${bet.potentialWinnings} credits`);
        } else {
          user.betsLost += 1;
          console.log(`User ${user.username} lost ${bet.amount} credits`);
        }
        await user.save();
      }
    }

    console.log(`Settled ${bets.length} bets for game ${game._id}`);
    return true;
  } catch (error) {
    console.error('Error settling bets:', error);
    throw error;
  }
} 