const axios = require('axios');
const Game = require('../models/Game');
const Bet = require('../models/Bet');
const User = require('../models/User');

// Function to fetch NBA games and odds from external API
exports.updateOdds = async () => {
  try {
    // Using The Odds API (https://the-odds-api.com/)
    // You'll need to sign up for an API key
    const response = await axios.get(`https://api.the-odds-api.com/v4/sports/basketball_nba/odds`, {
      params: {
        apiKey: process.env.ODDS_API_KEY,
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american'
      }
    });

    if (response.data && Array.isArray(response.data)) {
      for (const gameData of response.data) {
        // Extract game information
        const gameId = gameData.id;
        const homeTeam = gameData.home_team;
        const awayTeam = gameData.away_team;
        const startTime = new Date(gameData.commence_time);

        // Find or create game in our database
        let game = await Game.findOne({ gameId });

        if (!game) {
          // Create new game
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
        }

        // Update odds
        for (const bookmaker of gameData.bookmakers) {
          for (const market of bookmaker.markets) {
            if (market.key === 'h2h') {
              // Moneyline odds
              for (const outcome of market.outcomes) {
                if (outcome.name === homeTeam) {
                  game.odds.moneyline.home = outcome.price;
                } else if (outcome.name === awayTeam) {
                  game.odds.moneyline.away = outcome.price;
                }
              }
            } else if (market.key === 'spreads') {
              // Spread odds
              for (const outcome of market.outcomes) {
                if (outcome.name === homeTeam) {
                  game.odds.spread.home = outcome.point;
                  game.odds.spread.homeOdds = outcome.price;
                } else if (outcome.name === awayTeam) {
                  game.odds.spread.away = outcome.point;
                  game.odds.spread.awayOdds = outcome.price;
                }
              }
            } else if (market.key === 'totals') {
              // Total (over/under) odds
              for (const outcome of market.outcomes) {
                if (outcome.name === 'Over') {
                  game.odds.total.over = outcome.point;
                  game.odds.total.overOdds = outcome.price;
                } else if (outcome.name === 'Under') {
                  game.odds.total.under = outcome.point;
                  game.odds.total.underOdds = outcome.price;
                }
              }
            }
          }
        }

        // Update last updated timestamp
        game.lastUpdated = new Date();
        await game.save();
      }
    }

    console.log('Odds updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating odds:', error);
    throw error;
  }
};

// Function to update game status and settle bets
exports.updateGameResults = async () => {
  try {
    // Fetch game results from NBA API or another source
    // This is a placeholder - you'll need to implement the actual API call
    const response = await axios.get(`https://api.example.com/nba/scores`, {
      params: {
        apiKey: process.env.NBA_API_KEY,
        date: new Date().toISOString().split('T')[0]
      }
    });

    if (response.data && Array.isArray(response.data.games)) {
      for (const gameData of response.data.games) {
        // Find the game in our database
        const game = await Game.findOne({ gameId: gameData.id });

        if (game) {
          // Update game status and scores
          game.status = gameData.status;
          game.homeScore = gameData.home_score;
          game.awayScore = gameData.away_score;
          await game.save();

          // If game is finished, settle bets
          if (game.status === 'finished') {
            await settleBets(game);
          }
        }
      }
    }

    console.log('Game results updated successfully');
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

      // Update user stats
      const user = await User.findById(bet.user);
      if (user) {
        if (isWin) {
          // Add winnings to user balance
          user.balance += (bet.amount + bet.potentialWinnings);
          user.betsWon += 1;
          user.totalWon += bet.potentialWinnings;
        } else {
          user.betsLost += 1;
        }
        await user.save();
      }
    }

    console.log(`Settled ${bets.length} bets for game ${game._id}`);
  } catch (error) {
    console.error('Error settling bets:', error);
    throw error;
  }
} 