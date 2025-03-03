const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  homeTeam: {
    type: String,
    required: true
  },
  awayTeam: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'finished', 'cancelled'],
    default: 'scheduled'
  },
  homeScore: {
    type: Number,
    default: 0
  },
  awayScore: {
    type: Number,
    default: 0
  },
  odds: {
    moneyline: {
      home: Number,
      away: Number
    },
    spread: {
      home: Number,
      homeOdds: Number,
      away: Number,
      awayOdds: Number
    },
    total: {
      over: Number,
      overOdds: Number,
      under: Number,
      underOdds: Number
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Game', GameSchema); 