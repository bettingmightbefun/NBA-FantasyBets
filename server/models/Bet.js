const mongoose = require('mongoose');

const BetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  betType: {
    type: String,
    enum: ['moneyline', 'spread', 'total'],
    required: true
  },
  betSelection: {
    type: String,
    required: true
  },
  odds: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  potentialWinnings: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'won', 'lost', 'cancelled'],
    default: 'pending'
  },
  placedAt: {
    type: Date,
    default: Date.now
  },
  settledAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Calculate potential winnings based on bet amount and odds
BetSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('odds')) {
    if (this.odds > 0) {
      // Positive odds (e.g. +150)
      this.potentialWinnings = this.amount * (this.odds / 100);
    } else {
      // Negative odds (e.g. -200)
      this.potentialWinnings = this.amount * (100 / Math.abs(this.odds));
    }
  }
  next();
});

module.exports = mongoose.model('Bet', BetSchema); 