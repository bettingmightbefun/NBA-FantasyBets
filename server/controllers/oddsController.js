const Game = require('../models/Game');

// @desc    Get all upcoming games with odds
// @route   GET /api/odds
// @access  Private
exports.getUpcomingGames = async (req, res) => {
  try {
    console.log('Getting upcoming games...');
    
    // First try: Get any scheduled games regardless of date
    const allGames = await Game.find({
      status: 'scheduled'
    }).sort({ startTime: 1 });
    
    console.log(`Found ${allGames.length} total scheduled games`);
    
    if (allGames.length > 0) {
      return res.json(allGames);
    }
    
    // If no games found, return empty array
    console.log('No scheduled games found');
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