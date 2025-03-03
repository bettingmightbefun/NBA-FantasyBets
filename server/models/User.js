const mongoose = require('mongoose');

// Define the User schema with detailed validation
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    validate: {
      validator: function(v) {
        // Allow only alphanumeric characters and underscores
        return /^[a-zA-Z0-9_]+$/.test(v);
      },
      message: props => `${props.value} is not a valid username. Use only letters, numbers, and underscores.`
    }
  },
  balance: {
    type: Number,
    default: 1000, // Starting balance of $1000 in fake money
    min: [0, 'Balance cannot be negative']
  },
  betsPlaced: {
    type: Number,
    default: 0,
    min: [0, 'Bets placed cannot be negative']
  },
  betsWon: {
    type: Number,
    default: 0,
    min: [0, 'Bets won cannot be negative']
  },
  betsLost: {
    type: Number,
    default: 0,
    min: [0, 'Bets lost cannot be negative']
  },
  totalWagered: {
    type: Number,
    default: 0,
    min: [0, 'Total wagered cannot be negative']
  },
  totalWon: {
    type: Number,
    default: 0,
    min: [0, 'Total won cannot be negative']
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add a pre-save hook to log user creation
UserSchema.pre('save', function(next) {
  if (this.isNew) {
    console.log(`Creating new user with username: ${this.username}`);
  } else {
    console.log(`Updating user: ${this.username}`);
  }
  next();
});

// Add error handling for duplicate key errors
UserSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Username already exists'));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('User', UserSchema); 