const Bet = require('../models/Bet');
const User = require('../models/User');
const Game = require('../models/Game');

// @desc    Place a new bet
// @route   POST /api/bets
// @access  Private
exports.placeBet = async (req, res) => {
  try {
    const { gameId, betType, betSelection, amount } = req.body;

    // Validate bet amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid bet amount' });
    }

    // Find the game
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if game has already started
    if (new Date(game.startTime) < new Date()) {
      return res.status(400).json({ message: 'Cannot place bet on a game that has already started' });
    }

    // Get the user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has enough balance
    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Determine odds based on bet type and selection
    let odds;
    switch (betType) {
      case 'moneyline':
        odds = betSelection === game.homeTeam ? game.odds.moneyline.home : game.odds.moneyline.away;
        break;
      case 'spread':
        odds = betSelection === game.homeTeam ? game.odds.spread.homeOdds : game.odds.spread.awayOdds;
        break;
      case 'total':
        odds = betSelection === 'over' ? game.odds.total.overOdds : game.odds.total.underOdds;
        break;
      default:
        return res.status(400).json({ message: 'Invalid bet type' });
    }

    // Calculate potential winnings
    let potentialWinnings;
    if (odds > 0) {
      // Positive odds (e.g. +150)
      potentialWinnings = amount * (odds / 100);
    } else {
      // Negative odds (e.g. -200)
      potentialWinnings = amount * (100 / Math.abs(odds));
    }

    // Create the bet
    const bet = new Bet({
      user: req.user._id,
      game: gameId,
      betType,
      betSelection,
      odds,
      amount,
      potentialWinnings
    });

    // Save the bet
    await bet.save();

    // Update user balance and stats
    user.balance -= amount;
    user.betsPlaced += 1;
    user.totalWagered += amount;
    await user.save();

    res.status(201).json({
      message: 'Bet placed successfully',
      bet: {
        _id: bet._id,
        game: {
          _id: game._id,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          startTime: game.startTime
        },
        betType,
        betSelection,
        odds,
        amount,
        potentialWinnings,
        status: bet.status
      },
      newBalance: user.balance
    });
  } catch (error) {
    console.error('Place bet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all bets for a user
// @route   GET /api/bets
// @access  Private
exports.getUserBets = async (req, res) => {
  try {
    const bets = await Bet.find({ user: req.user._id })
      .populate('game', 'homeTeam awayTeam startTime status homeScore awayScore')
      .sort({ createdAt: -1 });

    res.json(bets);
  } catch (error) {
    console.error('Get user bets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single bet by ID
// @route   GET /api/bets/:id
// @access  Private
exports.getBetById = async (req, res) => {
  try {
    const bet = await Bet.findById(req.params.id)
      .populate('game', 'homeTeam awayTeam startTime status homeScore awayScore')
      .populate('user', 'username');

    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    // Check if the bet belongs to the user or if the user is an admin
    if (bet.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this bet' });
    }

    res.json(bet);
  } catch (error) {
    console.error('Get bet by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel a bet (only if game hasn't started)
// @route   DELETE /api/bets/:id
// @access  Private
exports.cancelBet = async (req, res) => {
  try {
    const bet = await Bet.findById(req.params.id);

    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    // Check if the bet belongs to the user
    if (bet.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this bet' });
    }

    // Check if bet is already settled
    if (bet.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel a bet that is already settled' });
    }

    // Find the game
    const game = await Game.findById(bet.game);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if game has already started
    if (new Date(game.startTime) < new Date()) {
      return res.status(400).json({ message: 'Cannot cancel a bet on a game that has already started' });
    }

    // Update bet status
    bet.status = 'cancelled';
    bet.settledAt = Date.now();
    await bet.save();

    // Refund user's balance
    const user = await User.findById(req.user._id);
    user.balance += bet.amount;
    user.betsPlaced -= 1;
    user.totalWagered -= bet.amount;
    await user.save();

    res.json({ message: 'Bet cancelled successfully', newBalance: user.balance });
  } catch (error) {
    console.error('Cancel bet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 