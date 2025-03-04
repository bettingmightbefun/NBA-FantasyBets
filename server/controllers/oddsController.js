const Game = require('../models/Game');

// @desc    Get all upcoming games with odds
// @route   GET /api/odds
// @access  Private
exports.getUpcomingGames = async (req, res) => {
  try {
    console.log('Getting upcoming games...');
    
    // Get current date/time
    const now = new Date();
    console.log(`Current date/time: ${now.toLocaleString()}`);
    
    // Calculate date 48 hours from now
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 48);
    console.log(`Future date/time (48 hours from now): ${futureDate.toLocaleString()}`);
    
    // Find games that are scheduled and within the next 48 hours
    const upcomingGames = await Game.find({
      status: 'scheduled',
      startTime: { 
        $gte: now,  // Greater than or equal to current time
        $lte: futureDate // Less than or equal to 48 hours from now
      }
    }).sort({ startTime: 1 });
    
    console.log(`Found ${upcomingGames.length} upcoming games in the next 48 hours`);
    
    // Group games by date for better logging
    const gamesByDate = {};
    upcomingGames.forEach(game => {
      const dateString = new Date(game.startTime).toDateString();
      if (!gamesByDate[dateString]) {
        gamesByDate[dateString] = [];
      }
      gamesByDate[dateString].push(`${game.homeTeam} vs ${game.awayTeam}`);
    });
    
    // Log games by date
    console.log('\nUpcoming games by date:');
    Object.keys(gamesByDate).sort().forEach(date => {
      console.log(`\n${date} (${gamesByDate[date].length} games):`);
      gamesByDate[date].forEach((game, index) => {
        console.log(`  ${index + 1}. ${game}`);
      });
    });
    
    // Log the games found
    if (upcomingGames.length > 0) {
      console.log('Upcoming games:');
      upcomingGames.forEach(game => {
        console.log(`- ${game.homeTeam} vs ${game.awayTeam}, ${new Date(game.startTime).toLocaleString()}`);
      });
      
      return res.json(upcomingGames);
    }
    
    // If no upcoming games found, try to find any scheduled games
    console.log('No upcoming games found in the next 48 hours, checking for any scheduled games');
    
    const anyScheduledGames = await Game.find({
      status: 'scheduled'
    }).sort({ startTime: 1 }).limit(20); // Limit to 20 games to avoid overwhelming the client
    
    console.log(`Found ${anyScheduledGames.length} scheduled games`);
    
    // Log the scheduled games found
    if (anyScheduledGames.length > 0) {
      console.log('Scheduled games:');
      anyScheduledGames.forEach(game => {
        console.log(`- ${game.homeTeam} vs ${game.awayTeam}, ${new Date(game.startTime).toLocaleString()}`);
      });
      
      // Trigger an odds update in the background to ensure we have the latest data
      setTimeout(() => {
        const { updateOdds } = require('../services/oddsService');
        updateOdds().catch(err => console.error('Background odds update failed:', err));
      }, 0);
      
      return res.json(anyScheduledGames);
    }
    
    // If no games found, return empty array
    console.log('No scheduled games found');
    
    // Trigger an odds update in the background
    setTimeout(() => {
      const { updateOdds } = require('../services/oddsService');
      updateOdds().catch(err => console.error('Background odds update failed:', err));
    }, 0);
    
    return res.json([]);
  } catch (error) {
    console.error('Get upcoming games error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a specific game with odds
// @route   GET /api/odds/:id
// @access  Private
exports.getGameById = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json(game);
  } catch (error) {
    console.error('Get game by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all live games
// @route   GET /api/odds/live
// @access  Private
exports.getLiveGames = async (req, res) => {
  try {
    const games = await Game.find({
      status: 'in_progress'
    }).sort({ startTime: 1 });
    
    res.json(games);
  } catch (error) {
    console.error('Get live games error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all finished games from the last 24 hours
// @route   GET /api/odds/finished
// @access  Private
exports.getFinishedGames = async (req, res) => {
  try {
    // Get games that finished in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    const games = await Game.find({
      status: 'finished',
      startTime: { $gte: oneDayAgo }
    }).sort({ startTime: -1 });
    
    res.json(games);
  } catch (error) {
    console.error('Get finished games error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 