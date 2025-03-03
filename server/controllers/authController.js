const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token with error handling
const generateToken = (id) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      throw new Error('JWT configuration error');
    }
    
    console.log('Generating JWT token for user ID:', id);
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
  } catch (error) {
    console.error('Error generating JWT token:', error);
    throw new Error('Authentication token generation failed');
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    console.log('Register attempt with data:', req.body);
    
    const { username } = req.body;
    
    if (!username) {
      console.log('Registration failed: No username provided');
      return res.status(400).json({ message: 'Username is required' });
    }

    // Check if user already exists
    console.log('Checking if user exists with username:', username);
    const userExists = await User.findOne({ username });

    if (userExists) {
      console.log('Registration failed: Username already taken');
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Create user
    console.log('Creating new user with username:', username);
    const user = await User.create({
      username
    });

    if (user) {
      // Generate token
      console.log('User created successfully, generating token');
      try {
        const token = generateToken(user._id);
        console.log('Token generated successfully');

        res.status(201).json({
          _id: user._id,
          username: user.username,
          isAdmin: user.isAdmin,
          balance: user.balance,
          betsPlaced: user.betsPlaced,
          betsWon: user.betsWon,
          betsLost: user.betsLost,
          totalWagered: user.totalWagered,
          totalWon: user.totalWon,
          token
        });
      } catch (tokenError) {
        console.error('Token generation failed:', tokenError);
        res.status(500).json({ message: 'Authentication error during registration' });
      }
    } else {
      console.log('Registration failed: Invalid user data');
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    
    // Send a more detailed error message in development
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Server error during registration' 
      : `Server error: ${error.message}`;
    
    res.status(500).json({ message: errorMessage });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username } = req.body;
    
    console.log('Login attempt with username:', username);

    // Find user by username (case insensitive)
    const user = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    if (user) {
      // Generate token
      const token = generateToken(user._id);
      
      console.log('User found, generating token');

      res.json({
        _id: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
        balance: user.balance,
        betsPlaced: user.betsPlaced,
        betsWon: user.betsWon,
        betsLost: user.betsLost,
        totalWagered: user.totalWagered,
        totalWon: user.totalWon,
        token
      });
    } else {
      console.log('User not found');
      res.status(401).json({ message: 'Invalid username' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
        balance: user.balance,
        betsPlaced: user.betsPlaced,
        betsWon: user.betsWon,
        betsLost: user.betsLost,
        totalWagered: user.totalWagered,
        totalWon: user.totalWon
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while getting profile' });
  }
}; 